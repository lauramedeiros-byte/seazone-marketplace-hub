-- Sync Nekt -> Postgres (Neon) do hub :: tabela `marketplace_lost`
-- Funil Marketplace = pipeline_id 37, status = lost. Grão = deal (1 lost por linha).
-- Base do filtro no painel = lost_date (data da perda).
-- Modo recomendado: FULL REFRESH (truncate + insert) a cada execução.
-- Colunas mapeiam 1:1 para marketplace_lost (id e synced_at são gerados pelo banco):
--   lost_date, motivo, empreendimento, etapa, etapa_ordem, canal
-- Regra de canal: contém 'pag' -> Midia Paga (inclui Google/Meta Ads); contém 'campaign' -> Base Interna; senão Outros.

SELECT
  CAST(d.data_de_perda AS date)                     AS lost_date,
  CAST(d.motivo_da_perda AS varchar)                AS motivo,
  CAST(d.empreendimento AS varchar)                 AS empreendimento,
  COALESCE(s.name, '(sem etapa)')                   AS etapa,
  COALESCE(s.order_nr, 0)                           AS etapa_ordem,
  CASE
    WHEN lower(coalesce(CAST(d.rd_campanha AS varchar), '')) LIKE '%pag%'
      OR lower(coalesce(CAST(d.rd_source AS varchar), '')) LIKE '%pag%' THEN 'Midia Paga'
    WHEN lower(coalesce(CAST(d.rd_campanha AS varchar), '')) LIKE '%campaign%'
      OR lower(coalesce(CAST(d.rd_source AS varchar), '')) LIKE '%campaign%' THEN 'Base Interna'
    ELSE 'Outros'
  END                                               AS canal
FROM "nekt_operacional_silver"."pipedrive_deals_readable" d
LEFT JOIN "nekt_operacional_bronze"."pipedrive_stages" s
  ON s.id = d.etapa AND s.pipeline_id = 37
WHERE d.pipeline_id = 37
  AND lower(d.status) = 'lost'
  AND d.data_de_perda IS NOT NULL;
