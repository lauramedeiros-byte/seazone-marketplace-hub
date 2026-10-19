// Cria a coluna "alerta" na tabela do planejamento (banco do hub). Rodar uma vez, antes do merge do PR #38:
//   cd C:/Users/compu/seazone-marketplace-hub; node --env-file=.env.local scripts/criar-coluna-alerta.mjs
// Só acrescenta uma coluna vazia: não apaga nem altera nada. Pode rodar de novo sem problema.
import pg from "pg";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query(`ALTER TABLE "PlanejamentoAcao" ADD COLUMN IF NOT EXISTS "alerta" TEXT`);
const r = await c.query(
  `select 1 from information_schema.columns where table_name='PlanejamentoAcao' and column_name='alerta'`
);
console.log(r.rowCount ? "OK: coluna alerta existe." : "ERRO: a coluna não apareceu.");
await c.end();
