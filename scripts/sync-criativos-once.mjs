// One-off: criativos de mídia paga do funil Marketplace (p37) Nekt -> Neon (cumulativo).
// Uso: node scripts/sync-criativos-once.mjs
import "dotenv/config";
import { Pool } from "pg";

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

function parseCSVLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const cols = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).filter((l) => l.trim()).map((l) => {
    const v = parseCSVLine(l);
    const r = {};
    cols.forEach((c, i) => { const x = (v[i] ?? "").trim(); r[c] = x === "" || x.toLowerCase() === "null" ? null : x; });
    return r;
  });
}
async function queryNekt(sql) {
  const apiKey = process.env.NEKT_API_KEY;
  if (!apiKey) throw new Error("NEKT_API_KEY não configurada");
  const res = await fetch("https://api.nekt.ai/api/v1/sql-query/", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ sql, mode: "csv" }),
  });
  if (!res.ok) throw new Error(`Nekt API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let urls = [];
  if (Array.isArray(data.presigned_urls) && data.presigned_urls.length) urls = data.presigned_urls;
  else if (data.presigned_url) urls = [data.presigned_url];
  else if (data.url) urls = [data.url];
  if (!urls.length) throw new Error("sem presigned_url: " + JSON.stringify(data));
  const chunks = await Promise.all(urls.map(async (u) => { const r = await fetch(u); return r.text(); }));
  const combined = chunks[0] + (chunks.length > 1 ? "\n" + chunks.slice(1).map((c) => c.trim().split("\n").slice(1).join("\n")).join("\n") : "");
  return parseCSV(combined);
}
async function main() {
  console.log("Consultando Nekt (p37 criativos mídia paga, cumulativo)…");
  const rows = await queryNekt(SQL);
  const data = rows.map((r) => ({
    criativo: (r.criativo ?? "").trim() || "(sem criativo)",
    plataforma: (r.plataforma ?? "Outros").trim() || "Outros",
    data_camp: r.data_camp ? String(r.data_camp) : null,
    leads: Number(r.leads) || 0, sql: Number(r.sql) || 0, reuniao: Number(r.reuniao) || 0,
    contrato: Number(r.contrato) || 0, won: Number(r.won) || 0,
  })).filter((d) => d.leads > 0);
  console.log(`Nekt retornou ${data.length} criativos.`);
  if (!data.length) { console.error("0 linhas — abortando."); process.exit(1); }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM paid_creative");
    const COLS = ["criativo", "plataforma", "data_camp", "leads", "sql", "reuniao", "contrato", "won"];
    const BATCH = 500;
    for (let i = 0; i < data.length; i += BATCH) {
      const slice = data.slice(i, i + BATCH);
      const values = []; const params = [];
      slice.forEach((d, j) => {
        const b = j * COLS.length;
        values.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8})`);
        params.push(d.criativo, d.plataforma, d.data_camp, d.leads, d.sql, d.reuniao, d.contrato, d.won);
      });
      await client.query(`INSERT INTO paid_creative (${COLS.join(",")}) VALUES ${values.join(",")}`, params);
    }
    await client.query("COMMIT");
    console.log(`OK — ${data.length} criativos inseridos em paid_creative.`);
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); await pool.end(); }
}
main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
