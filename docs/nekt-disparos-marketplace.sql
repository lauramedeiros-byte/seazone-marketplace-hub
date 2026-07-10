-- Sync Nekt -> Postgres (Neon) :: tabela `marketplace_disparo`
-- Análise de disparos da BASE INTERNA no funil Marketplace (pipeline 37).
-- Base interna = rd_source OU rd_campanha contém 'campaign' E nenhum contém 'pag' (exclui mídia paga).
-- Agregado por campanha (rd_campanha). Modo: FULL REFRESH (truncate + insert).
-- Colunas -> marketplace_disparo: campanha, data_camp, leads, sql, fup, contrato, won (id/synced_at gerados pelo banco).
--   sql      = chegou à faixa Contatados -> Reunião Agendada (etapa >= 2)
--   fup      = Reunião Realizada concluída (etapa >= FUP/9) ou won
--   contrato = chegou a Contrato (etapa >= 13) ou won
--   won      = status won

WITH d AS (
  SELECT cast(rd_campanha AS varchar) AS camp, lower(status) AS st, etapa
  FROM "nekt_operacional_silver"."pipedrive_deals_readable"
  WHERE pipeline_id = 37
    AND (lower(cast(rd_source AS varchar)) LIKE '%campaign%' OR lower(cast(rd_campanha AS varchar)) LIKE '%campaign%')
    AND lower(cast(rd_source AS varchar)) NOT LIKE '%pag%'
    AND lower(cast(rd_campanha AS varchar)) NOT LIKE '%pag%'
),
j AS (
  SELECT d.camp, d.st, coalesce(s.order_nr, 0) AS ord
  FROM d LEFT JOIN "nekt_operacional_bronze"."pipedrive_stages" s
    ON s.id = d.etapa AND s.pipeline_id = 37
)
SELECT
  coalesce(nullif(camp, ''), '(sem campanha)')                                        AS campanha,
  nullif(replace(regexp_extract(camp, '\d{4}[-_]\d{2}[-_]\d{2}'), '_', '-'), '')      AS data_camp,
  count(*)                                                                            AS leads,
  count(*) FILTER (WHERE ord >= 2)                                                    AS sql,
  count(*) FILTER (WHERE ord >= 9 OR st = 'won')                                       AS fup,
  count(*) FILTER (WHERE ord >= 13 OR st = 'won')                                      AS contrato,
  count(*) FILTER (WHERE st = 'won')                                                   AS won
FROM j
GROUP BY 1, 2;
