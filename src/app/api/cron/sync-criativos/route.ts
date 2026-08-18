import { NextResponse } from "next/server";
import { queryNekt } from "@/lib/nekt";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sync dos criativos de mídia paga (p37 = Marketplace) Nekt -> Postgres.
// Criativo = rd_campanha sem o ID da plataforma.
// Filtro: rd_source contém 'pag' e NÃO contém 'campaign' (nem em rd_source nem rd_campanha).
// Contagens CUMULATIVAS (chegar a uma etapa conta nas anteriores; won conta em tudo).
// Etapas p37: 2 Contatados · 8 Reunião Realizada · 13 Contrato.
const SQL = `
WITH d AS (
  SELECT
    cast(rd_campanha AS varchar) AS camp_full,
    regexp_replace(cast(rd_campanha AS varchar), '^[0-9]+_', '') AS criativo_raw,
    lower(status) AS st, etapa,
    coalesce(data_de_perda, ultima_alteracao_de_etapa) AS dt
  FROM "nekt_operacional_silver"."pipedrive_deals_readable"
  WHERE pipeline_id = 37
    AND lower(cast(rd_source AS varchar)) LIKE '%pag%'
    AND lower(cast(rd_source AS varchar)) NOT LIKE '%campaign%'
    AND lower(coalesce(cast(rd_campanha AS varchar), '')) NOT LIKE '%campaign%'
    AND NULLIF(trim(cast(rd_campanha AS varchar)), '') IS NOT NULL
),
j AS (
  SELECT
    coalesce(nullif(trim(d.criativo_raw), ''), '(sem criativo)') AS criativo,
    CASE
      WHEN lower(d.camp_full) LIKE '%google%' OR lower(d.camp_full) LIKE '%search%' THEN 'Google'
      WHEN regexp_like(d.camp_full, '^120[0-9]+') THEN 'Meta'
      ELSE 'Outros'
    END AS plataforma,
    d.st, coalesce(s.order_nr, 0) AS ord, d.dt
  FROM d LEFT JOIN "nekt_operacional_bronze"."pipedrive_stages" s
    ON s.id = d.etapa AND s.pipeline_id = 37
)
SELECT criativo, plataforma,
  date_format(max(dt), '%Y-%m-%d') AS data_camp,
  count(*) AS leads,
  count(*) FILTER (WHERE ord >= 2 OR st = 'won') AS sql,
  count(*) FILTER (WHERE ord >= 8 OR st = 'won') AS reuniao,
  count(*) FILTER (WHERE ord >= 13 OR st = 'won') AS contrato,
  count(*) FILTER (WHERE st = 'won') AS won
FROM j
GROUP BY criativo, plataforma`;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { rows } = await queryNekt(SQL);
    const data = rows
      .map((r) => ({
        criativo: String(r.criativo ?? "").trim() || "(sem criativo)",
        plataforma: String(r.plataforma ?? "Outros").trim() || "Outros",
        dataCamp: r.data_camp ? String(r.data_camp) : null,
        leads: Number(r.leads) || 0,
        sql: Number(r.sql) || 0,
        reuniao: Number(r.reuniao) || 0,
        contrato: Number(r.contrato) || 0,
        won: Number(r.won) || 0,
      }))
      .filter((d) => d.leads > 0);

    if (data.length === 0) {
      return NextResponse.json({ ok: false, error: "Nekt retornou 0 linhas — mantendo dados anteriores" }, { status: 502 });
    }

    const CHUNK = 2000;
    const ops = [db.paidCreative.deleteMany()];
    for (let i = 0; i < data.length; i += CHUNK) {
      ops.push(db.paidCreative.createMany({ data: data.slice(i, i + CHUNK) }));
    }
    await db.$transaction(ops);

    return NextResponse.json({ ok: true, criativos: data.length, at: new Date().toISOString() });
  } catch (error) {
    console.error("sync-criativos falhou:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
