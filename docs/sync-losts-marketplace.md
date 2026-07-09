# Sync — Dashboard de Losts do Marketplace

O dashboard em `/losts-marketplace` mostra os motivos de perda do **funil de
Marketplace (Pipedrive · pipeline 37)**, filtrando por **data da perda**.

## Como os dados chegam

```
Pipedrive ──> Nekt (pipedrive_deals_readable, p37) ──[SQL agregado]──> Postgres/Neon do hub
                                                                        tabela marketplace_lost_agg
                                                                                │
                                                          GET /api/losts-marketplace (agrega por período)
                                                                                │
                                                                   /losts-marketplace (4 gráficos)
```

- **Fonte:** `docs/nekt-losts-marketplace.sql` (rodar na Nekt).
- **Destino:** tabela `marketplace_lost_agg` no Postgres do hub (Neon).
- **Fallback:** enquanto a tabela não existir ou estiver vazia, a API usa o
  snapshot versionado em `src/data/losts-marketplace.json` — o painel nunca quebra.

## Passos para ligar o tempo real

1. **Criar a tabela** (migração Prisma do model `MarketplaceLostAgg`):
   ```bash
   npx prisma migrate deploy      # em produção
   # ou, para aplicar direto sem histórico de migração:
   npx prisma db push
   ```
2. **Configurar o sync na Nekt** (mesmo padrão do sync de gastos):
   - Query: conteúdo de `docs/nekt-losts-marketplace.sql`.
   - Destino: Postgres do hub (a `DATABASE_URL` do projeto no Vercel), tabela
     `marketplace_lost_agg`.
   - Modo: **full refresh** (truncate + insert) — a query já reagrega tudo.
   - Colunas: `chart, mes, dim_a, dim_b, etapa_ordem, n` (o banco preenche `id` e
     `synced_at`).
   - Agendamento: sugerido de hora em hora (ou 2–3x/dia). O painel sempre lê o
     último estado sincronizado.
3. Pronto. Assim que a tabela tiver linhas, a API passa a usar a Nekt
   automaticamente (sem mexer no front).

## Notas
- A query mantém **todos os motivos**; o corte "top N + Outros" é feito na API,
  por período, para os gráficos.
- Volume atual: ~6.560 linhas agregadas (histórico completo). Tabela leve.
- Para regerar o snapshot de fallback manualmente, rode a mesma SQL e reformate
  para o formato de `src/data/losts-marketplace.json`.
```
