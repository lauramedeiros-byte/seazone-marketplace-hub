// Importa o briefing do Campeche de 17/09/2026 e os 3 roteiros de teste.
// Lê o markdown do briefing e o roteiros.md da skill. Seguro rodar de novo: não duplica.
// node --env-file=.env scripts/importar-campeche.mjs <caminho-do-briefing.md> <caminho-do-roteiros.md>
import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "@prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const [, , caminhoBriefing, caminhoRoteiros] = process.argv;
const SLUG = "campeche-spot";
const GERADO_EM = new Date("2026-09-17T12:00:00Z");

function parseRoteiros(texto) {
  // Cada entrada começa com uma linha "---" seguida de "id: R00N".
  const blocos = texto.split(/\n---\nid: /).slice(1);
  return blocos.map((bloco) => {
    const [cabecalho, ...resto] = bloco.split(/\n---\n/);
    const meta = { id: cabecalho.split("\n")[0].trim() };
    for (const linha of cabecalho.split("\n").slice(1)) {
      const m = linha.match(/^([a-z_]+):\s*(.*)$/);
      if (m) meta[m[1]] = m[2].trim();
    }
    // tira o aviso de TESTE (o app já mostra pelo status) e o rodapé de pendência
    const corpo = resto
      .join("\n---\n")
      .replace(/^>\s.*$/gm, "")
      .split("\n## Pendência aberta")[0]
      .trim();
    return { meta, corpo };
  });
}

async function main() {
  const emp = await db.spotEmpreendimento.findUnique({ where: { slug: SLUG } });
  if (!emp) throw new Error(`Empreendimento ${SLUG} não existe. Rode o seed-spots antes.`);

  const jaTem = await db.spotBriefingRun.findFirst({
    where: { empreendimentoId: emp.id, geradoEm: GERADO_EM },
  });
  if (jaTem) {
    console.log("Esse briefing já foi importado — nada a fazer.");
    return;
  }

  const conteudoMd = fs.readFileSync(caminhoBriefing, "utf8");
  const roteiros = parseRoteiros(fs.readFileSync(caminhoRoteiros, "utf8"));

  const run = await db.spotBriefingRun.create({
    data: {
      empreendimentoId: emp.id,
      geradoEm: GERADO_EM,
      geradoPor: "Laura",
      origem: "skill",
      conteudoMd,
      artefatoUrl: "https://claude.ai/artifact/FMrBbyUTMYizkA5h1v2dK7",
      observacao:
        "Primeiro briefing rodado de ponta a ponta pelo motor das 37 skills. Os roteiros são teste: nunca foram produzidos.",
      resumoJson: {
        roiPct: 22.12,
        faturamentoLiquidoAno: 67817.63,
        valorizacaoPct: 86.9,
        aPartirDe: 348000,
        ticketMedioApartamentos: 454572.82,
        cotasDisponiveis: 10,
        posicaoCidade: "5º de 20 em Florianópolis",
        posicaoPortfolio: "6º de 37",
      },
      avisosJson: [
        {
          tipo: "divergencia",
          campo: "percentual de obra",
          valores: { construction_completion_pct: "26,71%", cronograma_mensal_ago2026: "55,89%" },
          nota: "Nenhum dos dois foi escolhido. Confirmar com a engenharia antes de usar em proposta.",
        },
      ],
      roteiros: {
        create: roteiros.map((r) => ({
          codigo: r.meta.id,
          formato: r.meta.formato,
          status: r.meta.status || "teste",
          duracao: r.meta.duracao || null,
          monica: r.meta.monica === "sim",
          estrutura: r.meta.estrutura || null,
          oQueMuda: r.meta.o_que_muda || null,
          derivadoDe: r.meta.derivado_de || null,
          conteudoMd: r.corpo,
        })),
      },
    },
    include: { roteiros: true },
  });

  console.log(`Pasta criada: ${run.id}`);
  for (const r of run.roteiros) console.log(`  ${r.codigo} · ${r.formato} · ${r.status}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => pool.end());
