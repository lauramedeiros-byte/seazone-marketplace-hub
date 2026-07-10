import { NextResponse } from "next/server";
import { queryNekt } from "@/lib/nekt";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sync dos disparos da base interna (p37) Nekt -> Postgres. Rodado pelo Vercel Cron
// a cada 4h (ver vercel.json). data_camp = data do nome ou do deal mais recente.
const SQL = `
WITH d AS (
  SELECT cast(rd_campanha AS varchar) AS camp, lower(status) AS st, etapa,
         coalesce(data_de_perda, ultima_alteracao_de_etapa) AS dt
  FROM "nekt_operacional_silver"."pipedrive_deals_readable"
  WHERE pipeline_id = 37
    AND (lower(cast(rd_source AS varchar)) LIKE '%campaign%' OR lower(cast(rd_campanha AS varchar)) LIKE '%campaign%')
    AND lower(cast(rd_source AS varchar)) NOT LIKE '%pag%'
    AND lower(cast(rd_campanha AS varchar)) NOT LIKE '%pag%'
),
j AS (
  SELECT coalesce(nullif(d.camp, ''), '(sem campanha)') AS campanha,
         nullif(replace(regexp_extract(coalesce(d.camp, ''), '\\d{4}[-_]\\d{2}[-_]\\d{2}'), '_', '-'), '') AS nome_data,
         d.st, coalesce(s.order_nr, 0) AS ord, d.dt
  FROM d LEFT JOIN "nekt_operacional_bronze"."pipedrive_stages" s
    ON s.id = d.etapa AND s.pipeline_id = 37
)
SELECT campanha,
  coalesce(nome_data, date_format(max(dt), '%Y-%m-%d')) AS data_camp,
  count(*) AS leads,
  count(*) FILTER (WHERE ord >= 2) AS sql,
  count(*) FILTER (WHERE ord >= 9 OR st = 'won') AS fup,
  count(*) FILTER (WHERE ord >= 13 OR st = 'won') AS contrato,
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
