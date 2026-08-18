# Sync — Dashboard de Losts do Marketplace

O dashboard em `/losts-marketplace` mostra os motivos de perda do **funil de
Marketplace (Pipedrive · pipeline 37)**, filtrando por **data da perda** (intervalo
de datas exatas).

## Como os dados chegam

```
Pipedrive ─> Nekt (pipedrive_deals_readable, p37) ─[SQL nível de deal]─> Postgres/Neon do hub
                                                                          tabela marketplace_lost
                                                                                  │
                                                    GET /api/losts-marketplace?from=&to= (agrega)
                                                                                  │
                                                                     /losts-marketplace (4 gráficos)
```

- **Fonte:** `docs/nekt-losts-marketplace.sql` (rodar na Nekt).
- **Destino:** tabela `marketplace_lost` no Postgres do hub (Neon), 1 linha por lost.
- **Fallback:** enquanto a tabela não existir/estiver vazia, a API usa o snapshot
  versionado em `src/data/losts-marketplace.json` (dados desde jan/2025) — o painel
  nunca quebra.

## Passos para ligar o tempo real

1. **Criar a tabela** (migração do model `MarketplaceLost`):
   ```bash
   npx prisma migrate deploy   # produção
   # ou:  npx prisma db push
   ```
2. **Configurar o sync na Nekt** (mesmo padrão do sync de gastos):
   - Query: `docs/nekt-losts-marketplace.sql`.
   - Destino: Postgres do hub (a `DATABASE_URL` do projeto no Vercel), tabela `marketplace_lost`.
   - Modo: **full refresh** (truncate + insert).
   - Colunas: `lost_date, motivo, empreendimento, etapa, etapa_ordem, canal`
     (o banco preenche `id` e `synced_at`).
   - Agendamento sugerido: de hora em hora (ou algumas vezes/dia).
3. Assim que a tabela tiver linhas, a API passa a usar a Nekt automaticamente,
   com todo o histórico e filtro por data exata — sem mexer no front.

## Notas
- Grão = deal: permite filtro por **intervalo de datas exatas** e recortes por
  motivo/empreendimento/canal/etapa, além dos presets de meses.
- Os cortes "top N motivos + Outros" dos gráficos são feitos na API, por período.
- Volume atual: ~30,6 mil losts (histórico completo) — tabela leve.
