import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// Rota do agente das opps da semana (tarefa do Windows, quinta 8h40). Fora do Clerk,
// protegida pelo mesmo header do agente de propostas (x-agente-token = AGENTE_DISPAROS_TOKEN).
// Regras do agente: ~/projects/disparos/agente-opps-semana/REGRAS.md
function autorizado(request: Request) {
  const esperado = process.env.AGENTE_DISPAROS_TOKEN;
  return !!esperado && request.headers.get("x-agente-token") === esperado;
}

// OppSemana.weekStart é "timestamp without time zone" com a segunda à meia-noite
// (2026-10-19 00:00); o Prisma lê como 00:00 UTC. Usar outra hora cria semana duplicada.
function segunda(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`Data inválida: ${iso}`);
  const d = new Date(`${iso}T00:00:00Z`);
  if (d.getUTCDay() !== 1) throw new Error(`${iso} não é segunda-feira`);
  return d;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

// GET ?semana=YYYY-MM-DD (segunda da semana de PUBLICAÇÃO)
// → histórico de opps (16 semanas, para o "4+ semanas fora"), o que já existe na semana alvo,
//   pedidos de troca em aberto, reprovadas e aprendizados do agente, catálogo vivo.
export async function GET(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const semanaParam = url.searchParams.get("semana");
    const alvo = semanaParam ? segunda(semanaParam) : null;
    const desde = new Date((alvo ?? new Date()).getTime() - 16 * 7 * 86400000);

    const [semanas, trocas, reprovadas, aprendizados, catalogo] = await Promise.all([
      db.oppSemana.findMany({
        where: { weekStart: { gte: desde } },
        include: { items: { orderBy: { criadoEm: "asc" } } },
        orderBy: { weekStart: "desc" },
      }),
      db.oppItem.findMany({ where: { pedidoTroca: { not: null } }, include: { semana: true } }),
      db.propostaDisparo.findMany({ where: { status: "reprovada", origem: "opp-semana" }, orderBy: { decididoEm: "asc" } }),
      db.aprendizadoDisparo.findMany({ where: { ativo: true }, orderBy: { criadoEm: "asc" } }),
      db.revendaEmpreendimento.findMany({ orderBy: { nome: "asc" } }),
    ]);

    const historico = semanas.map((s) => ({
      semana: iso(s.weekStart),
      // até 28/09/2026 o registro usava a semana da escolha (publicação = semana seguinte)
      publicacao: s.weekStart.getTime() >= Date.UTC(2026, 9, 5) ? iso(s.weekStart) : iso(new Date(s.weekStart.getTime() + 7 * 86400000)),
      itens: s.items.map((i) => ({
        id: i.id,
        nome: i.nomeEmpreendimento,
        cota: i.cota,
        preco: i.preco,
        dono: i.tipoDestaque === "monica" ? "monica" : i.destaque ? "mkt" : "sobra",
        origem: i.origem,
      })),
    }));

    return NextResponse.json({
      semanaAlvo: alvo ? historico.find((h) => h.semana === iso(alvo)) ?? { semana: iso(alvo), itens: [] } : null,
      historico,
      trocas: trocas.map((t) => ({
        id: t.id,
        semana: iso(t.semana.weekStart),
        nome: t.nomeEmpreendimento,
        cota: t.cota,
        dono: t.tipoDestaque === "monica" ? "monica" : "mkt",
        motivo: t.pedidoTroca,
      })),
      reprovadas,
      // aprendizados das duas origens: os de copy valem para os dois agentes; o campo origem diz de onde veio
      aprendizados,
      catalogo,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

interface PropostaIn {
  mes: string;
  dia: number;
  titulo: string;
  base?: string;
  contatos?: number;
  empreendimentos?: string;
  whatsapp: string;
  racional?: string;
}
interface ItemIn {
  nome: string;
  cota: string;
  preco: string;
  dono: "mkt" | "monica";
  justificativa?: string;
  slackLink?: string;
  propostas?: PropostaIn[]; // só mkt: 1º e 2º toque
}

async function criarPropostas(oppItemId: string, ps: PropostaIn[]) {
  const ids: string[] = [];
  for (const p of ps) {
    if (!p.mes || !p.dia || !p.titulo || !p.whatsapp) throw new Error("Cada proposta precisa de mes, dia, titulo e whatsapp");
    const ordem = await db.propostaDisparo.count({ where: { mes: p.mes, dia: Number(p.dia) } });
    const c = await db.propostaDisparo.create({
      data: {
        mes: p.mes,
        dia: Number(p.dia),
        ordem,
        titulo: String(p.titulo),
        base: p.base ?? null,
        contatos: p.contatos != null ? Number(p.contatos) : null,
        empreendimentos: p.empreendimentos ?? null,
        whatsapp: String(p.whatsapp),
        racional: p.racional ?? null,
        origem: "opp-semana",
        oppItemId,
      },
    });
    ids.push(c.id);
  }
  return ids;
}

// POST { semana: "YYYY-MM-DD", itens: [4 itens] } → grava a semana (registro do /opps-da-semana)
// e as propostas de marketing (página de propostas). Não sobrescreve: se a semana já tem opp
// escolhida pelo agente, recusa (troca é pelo PATCH).
export async function POST(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { semana, itens } = (await request.json()) as { semana: string; itens: ItemIn[] };
    const weekStart = segunda(semana);
    if (!Array.isArray(itens) || itens.length === 0) throw new Error("Envie { semana, itens: [...] }");
    if (itens.some((i) => !i.nome || !i.cota || !["mkt", "monica"].includes(i.dono)))
      throw new Error("Cada item precisa de nome, cota e dono (mkt | monica)");

    const sem = await db.oppSemana.upsert({ where: { weekStart }, update: {}, create: { weekStart } });
    const jaTem = await db.oppItem.count({ where: { semanaId: sem.id, origem: "agente" } });
    if (jaTem > 0) throw new Error(`A semana ${semana} já tem ${jaTem} opp(s) do agente — use PATCH para trocar`);

    const criados = [];
    for (const i of itens) {
      const item = await db.oppItem.create({
        data: {
          semanaId: sem.id,
          nomeEmpreendimento: i.nome,
          cota: i.cota,
          preco: i.preco ?? null,
          destaque: i.dono === "mkt",
          tipoDestaque: i.dono === "monica" ? "monica" : null,
          justificativa: i.justificativa ?? null,
          origem: "agente",
          slackStatus: i.dono === "monica" ? "sugerida" : null,
          slackLink: i.slackLink ?? null,
        },
      });
      const propostas = i.dono === "mkt" && i.propostas?.length ? await criarPropostas(item.id, i.propostas) : [];
      criados.push({ id: item.id, nome: i.nome, cota: i.cota, dono: i.dono, propostas });
    }
    revalidatePath("/opps-da-semana");
    revalidatePath("/planejamento-organico/propostas");
    return NextResponse.json({ success: true, semana, criados });
  } catch (error) {
    console.error("Erro na API agente-opps:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

// PATCH
// { itemId, slackStatus?, slackLink? }                       → andamento do Slack (Mônica)
// { itemId, troca: { nome, cota, preco, justificativa, propostas? } } → troca a cota (botão
//   "Trocar cota" ou ajuste pedido no Slack): o item mantém o id e a semana; as propostas
//   pendentes da cota antiga são descartadas e as novas entram.
export async function PATCH(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const body = await request.json();
    const item = await db.oppItem.findUnique({ where: { id: String(body.itemId ?? "") } });
    if (!item) throw new Error("Opp não encontrada");

    if (body.troca) {
      const t = body.troca as Omit<ItemIn, "dono">;
      if (!t.nome || !t.cota) throw new Error("A troca precisa de nome e cota");
      const antigo = `${item.nomeEmpreendimento} ${item.cota ?? ""}`.trim();
      await db.propostaDisparo.updateMany({
        where: { oppItemId: item.id, status: { in: ["pendente", "reprovada"] } },
        data: { status: "descartada", comentario: `Cota trocada (${antigo} → ${t.nome} ${t.cota})` },
      });
      await db.oppItem.update({
        where: { id: item.id },
        data: {
          nomeEmpreendimento: t.nome,
          cota: t.cota,
          preco: t.preco ?? null,
          justificativa: [t.justificativa, `Troca de ${antigo}${item.pedidoTroca ? ` (${item.pedidoTroca})` : ""}`]
            .filter(Boolean)
            .join(" · "),
          pedidoTroca: null,
          ...(item.tipoDestaque === "monica" ? { slackStatus: "sugerida" } : {}),
        },
      });
      const propostas = item.tipoDestaque !== "monica" && t.propostas?.length ? await criarPropostas(item.id, t.propostas) : [];
      revalidatePath("/opps-da-semana");
      revalidatePath("/planejamento-organico/propostas");
      return NextResponse.json({ success: true, trocado: item.id, propostas });
    }

    const status = body.slackStatus as string | undefined;
    if (status && !["sugerida", "aprovada", "postada"].includes(status)) throw new Error("slackStatus: sugerida | aprovada | postada");
    await db.oppItem.update({
      where: { id: item.id },
      data: { ...(status ? { slackStatus: status } : {}), ...(body.slackLink ? { slackLink: String(body.slackLink) } : {}) },
    });
    revalidatePath("/opps-da-semana");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
