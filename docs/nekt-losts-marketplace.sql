-- Sync Nekt -> Postgres (Neon) do hub :: tabela `marketplace_lost_agg`
-- Funil Marketplace = pipeline_id 37, status = lost. Base de data = data_de_perda.
-- Modo recomendado: FULL REFRESH (truncate + insert) a cada execução.
-- Colunas de saída mapeiam 1:1 para marketplace_lost_agg (id e synced_at são gerados pelo banco).
--   chart  : c1=motivos | c2=empreendimento x motivo | c3=canal | c4=etapa x motivo
--   dim_a  : c1=motivo | c2=empreendimento | c3=canal | c4=nome da etapa
--   dim_b  : c2/c4=motivo | c1/c3=''  (vazio)
--   etapa_ordem: só em c4 (ordem da etapa no funil)
--   n      : contagem de contatos perdidos
-- Regra de canal: contém 'pag' -> Midia Paga (inclui Google/Meta Ads); contém 'campaign' -> Base Interna; senão Outros.

WITH base AS (
  SELECT
    date_format(d.data_de_perda, '%Y-%m') AS mes,
    CAST(d.motivo_da_perda AS varchar) AS motivo,
    CAST(d.empreendimento AS varchar) AS empreendimento,
    d.etapa AS etapa_id,
    CASE
      WHEN lower(coalesce(CAST(d.rd_campanha AS varchar), '')) LIKE '%pag%'
        OR lower(coalesce(CAST(d.rd_source AS varchar), '')) LIKE '%pag%' THEN 'Midia Paga'
      WHEN lower(coalesce(CAST(d.rd_campanha AS varchar), '')) LIKE '%campaign%'
        OR lower(coalesce(CAST(d.rd_source AS varchar), '')) LIKE '%campaign%' THEN 'Base Interna'
      ELSE 'Outros'
    END AS canal
  FROM "nekt_operacional_silver"."pipedrive_deals_readable" d
  WHERE d.pipeline_id = 37
    AND lower(d.status) = 'lost'
    AND d.data_de_perda IS NOT NULL
)
SELECT 'c1' AS chart, mes, motivo AS dim_a, '' AS dim_b, CAST(NULL AS integer) AS etapa_ordem, count(*) AS n
  FROM base GROUP BY mes, motivo
UNION ALL
SELECT 'c3', mes, canal, '', NULL, count(*)
  FROM base GROUP BY mes, canal
UNION ALL
SELECT 'c2', mes, empreendimento, motivo, NULL, count(*)
  FROM base
  WHERE empreendimento IS NOT NULL AND empreendimento NOT IN ('', 'Aguardando definição')
  GROUP BY mes, empreendimento, motivo
UNION ALL
SELECT 'c4', b.mes, s.name, b.motivo, s.order_nr, count(*)
  FROM base b
  LEFT JOIN "nekt_operacional_bronze"."pipedrive_stages" s
    ON s.id = b.etapa_id AND s.pipeline_id = 37
  GROUP BY b.mes, s.name, b.motivo, s.order_nr;
