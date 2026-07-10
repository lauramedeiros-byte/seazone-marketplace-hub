import { NextResponse } from "next/server";
import { queryNekt } from "@/lib/nekt";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sync dos losts do funil Marketplace (p37) Nekt -> Postgres (grão = deal).
// Rodado pelo Vercel Cron 1x/dia. Full-refresh na tabela marketplace_lost.
const SQL = `
SELECT
  CAST(d.data_de_perda AS date) AS lost_date,
  CAST(d.motivo_da_perda AS varchar) AS motivo,
  CAST(d.empreendimento AS varchar) AS empreendimento,
  COALESCE(s.name, '(sem etapa)') AS etapa,
  COALESCE(s.order_nr, 0) AS etapa_ordem,
  CASE
    WHEN lower(coalesce(cast(d.rd_campanha AS varchar), '')) LIKE '%pag%'
      OR lower(coalesce(cast(d.rd_source AS varchar), '')) LIKE '%pag%' THEN 'Midia Paga'
    WHEN lower(coalesce(cast(d.rd_campanha AS varchar), '')) LIKE '%campaign%'
      OR lower(coalesce(cast(d.rd_source AS varchar), '')) LIKE '%campaign%' THEN 'Base Interna'
    ELSE 'Outros'
  END AS canal
FROM "nekt_operacional_silver"."pipedrive_deals_readable" d
LEFT JOIN "nekt_operacional_bronze"."pipedrive_stages" s
  ON s.id = d.etapa AND s.pipeline_id = 37
WHERE d.pipeline_id = 37 AND lower(d.status) = 'lost' AND d.data_de_perda IS NOT NULL
  AND d.data_de_perda >= from_iso8601_timestamp('2025-01-01T00:00:00Z')`;

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
        lostDate: new Date(String(r.lost_date) + "T00:00:00Z"),
        motivo: String(r.motivo ?? "").trim() || "(sem motivo)",
        empreendimento: String(r.empreendimento ?? "").trim(),
        etapa: String(r.etapa ?? "").trim() || "(sem etapa)",
        etapaOrdem: Number(r.etapa_ordem) || 0,
        canal: String(r.canal ?? "Outros").trim(),
      }))
      .filter((d) => !isNaN(d.lostDate.getTime()));

    if (data.length === 0) {
      return NextResponse.json({ ok: false, error: "Nekt retornou 0 linhas — mantendo dados anteriores" }, { status: 502 });
    }

    // full-refresh em lote (chunks < 65535 params: 6 colunas -> ~4000 linhas/chunk)
    const CHUNK = 4000;
    const ops = [db.marketplaceLost.deleteMany()];
    for (let i = 0; i < data.length; i += CHUNK) {
      ops.push(db.marketplaceLost.createMany({ data: data.slice(i, i + CHUNK) }));
    }
    await db.$transaction(ops);

    return NextResponse.json({ ok: true, losts: data.length, at: new Date().toISOString() });
  } catch (error) {
    console.error("sync-losts falhou:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
