import { NextResponse } from "next/server";
import { queryNekt } from "@/lib/nekt";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sync dos disparos da base interna (p37) Nekt -> Postgres. Rodado pelo Vercel Cron
// a cada 4h (ver vercel.json). data_camp = data do nome ou do deal mais recente.
const SQL = `
WITH d AS (
  SELECT cast(id AS bigint) AS deal_id,
         cast(rd_campanha AS varchar) AS camp, lower(status) AS st, etapa,
         coalesce(data_de_perda, ultima_alteracao_de_etapa) AS dt
  FROM "nekt_operacional_silver"."pipedrive_deals_readable"
  WHERE pipeline_id = 37
    AND (lower(cast(rd_source AS varchar)) LIKE '%campaign%' OR lower(cast(rd_campanha AS varchar)) LIKE '%campaign%')
    -- 'pag' se filtra SO pelo rd_source. Filtrar tambem pelo rd_campanha derruba campanha
    -- de disparo com PAGO no nome (ex.: LOST_MQL_PAGO_S_CAMPANHA), que e disparo organico
    -- para uma base que veio de pago e ENTRA na analise. Medido em 17/09/2026: o filtro
    -- a mais escondia 1.080 deals e 12 campanhas.
    AND lower(cast(rd_source AS varchar)) NOT LIKE '%pag%'
),
stg AS (
  SELECT cast(id AS varchar) AS sid_txt, order_nr
  FROM "nekt_operacional_bronze"."pipedrive_stages"
  WHERE pipeline_id = 37
),
acum AS (
  -- Etapa mais alta por onde o deal JA PASSOU, pelo historico de mudanca de etapa.
  SELECT d.deal_id, max(stg.order_nr) AS max_ord
  FROM d
  JOIN "nekt_operacional_bronze"."pipedrive_deal_flow" f
       ON f.item_id = d.deal_id AND f.field_key = 'stage_id'
  JOIN stg ON stg.sid_txt = f.new_value
  GROUP BY d.deal_id
),
j AS (
  SELECT coalesce(nullif(d.camp, ''), '(sem campanha)') AS campanha,
         nullif(replace(regexp_extract(coalesce(d.camp, ''), '\\d{4}[-_]\\d{2}[-_]\\d{2}'), '_', '-'), '') AS nome_data,
         d.st,
         -- ACUMULO, nunca foto: o deal que passou pela etapa conta para sempre, mesmo que
         -- hoje esteja em outra ou tenha dado lost depois.
         -- E o MAIOR entre o historico e a etapa de hoje, de proposito:
         --   * so o historico nao serve -> o pipedrive_deal_flow atrasa ~7 dias e perderia
         --     os deals da semana corrente (eram 32 em 17/09/2026);
         --   * so a etapa de hoje nao serve -> perde quem passou pela reuniao e saiu
         --     (era o bug de 2026-07 e 2026-09, ver lessons.md do projeto disparos).
         -- O maior dos dois cobre os dois casos e nunca subestima.
         greatest(coalesce(a.max_ord, 0), coalesce(s.order_nr, 0)) AS ord,
         d.dt
  FROM d
  LEFT JOIN stg s ON s.sid_txt = cast(d.etapa AS varchar)
  LEFT JOIN acum a ON a.deal_id = d.deal_id
)
SELECT campanha,
  coalesce(nome_data, date_format(max(dt), '%Y-%m-%d')) AS data_camp,
  count(*) AS leads,
  count(*) FILTER (WHERE ord >= 2) AS sql,
  -- Reuniao/FUP = da "Reuniao Realizada" (ordem 8) ate a etapa anterior a Contrato
  -- ("Reserva", ordem 12). Contrato (13) e won contam so nas colunas Contrato/WON.
  count(*) FILTER (WHERE ord >= 8 AND ord <= 12) AS fup,
  -- Contrato = chegou na etapa "Contrato" (ordem 13) e ainda nao e won.
  count(*) FILTER (WHERE ord >= 13 AND st <> 'won') AS contrato,
  -- WON = so negocio ganho.
  count(*) FILTER (WHERE st = 'won') AS won
FROM j
GROUP BY campanha, nome_data`;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const { rows } = await queryNekt(SQL);
    const data = rows
      .map((r) => ({
        campanha: String(r.campanha ?? "").trim() || "(sem campanha)",
        dataCamp: r.data_camp ? String(r.data_camp) : null,
        leads: Number(r.leads) || 0,
        sql: Number(r.sql) || 0,
        fup: Number(r.fup) || 0,
        contrato: Number(r.contrato) || 0,
        won: Number(r.won) || 0,
      }))
      .filter((d) => d.leads > 0);

    if (data.length === 0) {
      return NextResponse.json({ ok: false, error: "Nekt retornou 0 linhas — mantendo dados anteriores" }, { status: 502 });
    }

    await db.$transaction([
      db.marketplaceDisparo.deleteMany(),
      db.marketplaceDisparo.createMany({ data }),
    ]);

    return NextResponse.json({ ok: true, campanhas: data.length, at: new Date().toISOString() });
  } catch (error) {
    console.error("sync-disparos falhou:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
