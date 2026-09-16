# seazone-marketplace-hub — arquitetura e schema das páginas

Guia de referência pra quem (pessoa ou agente) abre esse repo pela primeira vez em outra máquina.

## Stack

- **Next.js 16.2.6** (App Router) + **React 19.2.4** + TypeScript
- **Tailwind CSS v4** (via `@tailwindcss/postcss`) + componentes shadcn/ui em `src/components/ui/`
- **Prisma 7** com adapter `@prisma/adapter-pg` (Pool do `pg`) → **Postgres (Neon)**
- **Clerk** (`@clerk/nextjs`) pra autenticação
- **Recharts** pros gráficos
- Deploy na **Vercel**

⚠️ Next.js 16 tem breaking changes em relação a versões anteriores (ver `AGENTS.md`). Antes de escrever código de rota/params/cache, consultar `node_modules/next/dist/docs/`.

## Padrão de página (importante)

Quase toda página segue o mesmo desenho de 3 camadas:

```
src/app/<rota>/page.tsx        → server component fininho, só renderiza o client
src/components/<rota>-client.tsx → todo o estado, filtros, gráficos, fetch
src/app/api/<recurso>/route.ts   → API route que fala com o Prisma
```

Exemplo real (`/losts-marketplace`):

```tsx
// src/app/losts-marketplace/page.tsx
import { LostsMarketplaceClient } from "@/components/losts-marketplace-client";
export const dynamic = "force-dynamic";
export default function LostsMarketplacePage() {
  return <LostsMarketplaceClient />;
}
```

O client component chama `/api/losts-marketplace`, que lê do Prisma. Páginas que dependem de dados sempre marcam `export const dynamic = "force-dynamic"` (sem cache).

A home (`src/app/page.tsx`) é um client component com um array `subCards` — **pra adicionar uma página nova ao hub, é preciso incluir o card nesse array**.

## Rotas de página

| Rota | Client component | Do que trata |
|---|---|---|
| `/` | `sub-card-search.tsx` | home do hub, grid de cards com busca |
| `/acompanhamento-de-metas` | `metas-client.tsx` | metas trimestrais |
| `/artefatos-de-consulta` | `artefatos-client.tsx` | cotas, empreendimentos, faróis |
| `/artefatos-de-consulta/criativos-que-funcionaram` | `criativos-passado-client.tsx` | criativos que performaram |
| `/briefings` e `/briefings-lista` | — | briefings de campanha (proteção por código) |
| `/losts` | `losts-client.tsx` | losts (board geral) |
| `/losts-marketplace` | `losts-marketplace-client.tsx` | dashboard do funil de losts do Marketplace (p37) |
| `/midia-paga` | `campanhas-client.tsx` | KPIs de mídia paga |
| `/midia-paga/analise-disparos` | `disparos-marketplace-client.tsx` | ranking de campanhas de disparo + termômetro |
| `/midia-paga/analise-midia-paga` | `analise-criativos-client.tsx` | análise de criativos |
| `/midia-paga/analises-claude` | `analises-claude-client.tsx` | análises salvas |
| `/opps-da-semana` | `opps-client.tsx` | 5 oportunidades da semana + passo a passo editável |
| `/opps-textos-monica` | — | textos da Mônica |
| `/planejamento-organico` | `planejamento-client.tsx` | calendário mensal de ações por frente + envio no Slack |
| `/pontos-fortes` | — | pontos fortes |
| `/prioridades-midia-paga` | `prioridades-midia-paga-client.tsx` | prioridades de mídia paga |
| `/respescagem` | `repescagem-client.tsx` | repescagem de empreendimentos/números |

## API routes (`src/app/api/`)

Leitura/escrita: `campanhas`, `campanhas/[id]`, `opps`, `planejamento`, `planejamento/slack`, `losts-marketplace`, `lost-board`, `disparos-marketplace`, `analise-criativos`, `analises-claude`, `analises-claude/[id]`, `criativos-passado`, `prioridades-midia-paga`, `prioridades-midia-paga/seed`, `create-empreendimento`, `toggle-verificado`, `seed-opps`, `seed-respescagem`.

Crons — puxam dados da **Nekt** (ver `src/lib/nekt.ts` e os SQLs em `docs/`). Agendados no `vercel.json`: `api/cron/sync-disparos` (06:00 UTC) e `api/cron/sync-losts` (06:30 UTC). `api/cron/sync-criativos` existe mas **não está agendado** — só roda se chamado na mão.

## Camada de dados

- `src/lib/db.ts` — singleton do Prisma Client (Pool `pg` + `PrismaPg`), exportado como `db`. Exige `DATABASE_URL`.
- `src/lib/nekt.ts` — cliente da API da Nekt (data lake); as queries SQL correspondentes estão em `docs/nekt-losts-marketplace.sql` e `docs/nekt-disparos-marketplace.sql`.
- `src/lib/slack.ts` — envia mensagem/thread no Slack (usado pelo Planejamento Orgânico).
- `src/lib/actions.ts` — server actions.
- `src/data/*.json` — snapshots/fallback de dados (losts, disparos, criativos).
- `prisma/schema.prisma` — 29 models. Grupos principais:
  - **Auth/base:** `User`
  - **Repescagem:** `RepescagemEmpreendimento`, `RepescagemNumero`
  - **Opps:** `OppSemana`, `OppItem`, `OppsPassoAPasso`, `OppsCalendarioSemana`
  - **Losts:** `LostGrupo`, `LostDisparo`, `LostHistorico`, `LostBoard`, `MarketplaceLost`
  - **Mídia paga:** `Campanha`, `MidiaPagaMes`, `MidiaPagaPrioridade`, `MidiaPagaFormato`, `MidiaPagaEstrutura`, `MidiaPagaVariacao`, `PaidCreative`, `CriativoPastaEmp`, `CriativoRegistro`, `AnaliseClaude`
  - **Disparos:** `MarketplaceDisparo`
  - **Planejamento:** `PlanejamentoFrente`, `PlanejamentoAcao`
  - **Outros:** `Briefing`, `Meta`, `ArtefatoConfig`, `Empreendimento`

## Rodando local

```bash
npm install            # roda `prisma generate` no postinstall
cp .env.example .env   # preencher as chaves (ver abaixo)
npx prisma generate
npm run dev            # http://localhost:3000
```

Variáveis necessárias (`.env` / `.env.local`):

- `DATABASE_URL` — Postgres (Neon)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk
- `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ENTREGA_DISPAROS` — botão "Enviar no Slack"
- `NEKT_API_KEY` — API de SQL da Nekt, usada pelos crons de sync (não está no `.env.example`, mas é obrigatória pros syncs)

Scripts: `npm run dev`, `npm run build` (= `prisma generate && next build`), `npm start`, `npm run lint`.

## Git

Remote: `https://github.com/lauramedeiros-byte/seazone-marketplace-hub.git` — branch principal `master`, trabalho em branches `feat/*`.
