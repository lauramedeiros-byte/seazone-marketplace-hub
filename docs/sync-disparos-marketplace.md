# Sync — Análise de disparo (base interna)

Sub-card em `/midia-paga/analise-disparos`. Ranqueia as campanhas de disparo da
**base interna** do funil Marketplace (Pipedrive · pipeline 37).

## Base interna (definição do filtro)
Disparos RD Station / MIA para a base própria (leads já da casa: perdidos, lista
fria, "não abriram", "oportunidade da semana") — **não** é mídia paga.
- **INCLUI:** `rd_source` ou `rd_campanha` contém `"campaign"`.
- **EXCLUI:** qualquer `"pag"` (mídia paga: "busca paga | facebook ads" etc.).

## Termômetro
Pondera as etapas alcançadas: **WON (peso 15) › Contrato (8) › Reunião Realizada/FUP (4) › SQL (1)**.
- **SQL** = chegou à faixa Contatados → Reunião Agendada (etapa ≥ Contatados).
- **FUP** = Reunião Realizada concluída (etapa ≥ FUP) ou won.
- **Contrato** = chegou a Contrato ou won. **WON** = status won.

## Fluxo de dados
```
Pipedrive → Nekt (pipedrive_deals_readable, p37) → [SQL agregado] → Postgres/Neon (marketplace_disparo)
                                                                       ↓
                                                    /api/disparos-marketplace → /midia-paga/analise-disparos
```
- **Fonte:** `docs/nekt-disparos-marketplace.sql`.
- **Fallback:** `src/data/disparos-marketplace.json` (snapshot) enquanto a tabela não existir.

## Ligar o tempo real
1. `npx prisma migrate deploy` (ou `npx prisma db push`) — cria `marketplace_disparo`.
2. Configurar sync na Nekt: query = `docs/nekt-disparos-marketplace.sql`; destino =
   Postgres do hub, tabela `marketplace_disparo`; modo **full refresh**; colunas
   `campanha, data_camp, leads, sql, fup, contrato, won`; agendar (ex.: de hora em hora — todo dia entram campanhas).
3. Assim que a tabela tiver linhas, a API usa a Nekt automaticamente.

## Notas
- Filtro de período usa a **data no nome da campanha** (ex.: `2026-05-26_...`). Campanhas
  sem data no nome aparecem sempre.
- A tabela de **padrões** deriva do nome do `[RD] Campanha` no próprio front (timing,
  oportunidade-da-semana, hóspedes, lostop, não abriram, repescagem, etc.).
