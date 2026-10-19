import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// Conferência das 17h30 (tarefa do Windows na máquina da Laura): lê as threads do
// #entrega_disparos, pega o que a Raira respondeu (RD campanha, contatos, horários) e
// preenche a ação no planejamento. Fora do Clerk, protegida por x-agente-token.
function autorizado(request: Request) {
  const esperado = process.env.AGENTE_DISPAROS_TOKEN;
  return !!esperado && request.headers.get("x-agente-token") === esperado;
}

/** "2026-10-19" -> { mes: "2026-10", dia: 19, num: 20261019 } */
function parseData(s: string | null) {
  const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { mes: `${m[1]}-${m[2]}`, dia: Number(m[3]), num: Number(m[1] + m[2] + m[3]) };
}

// GET ?desde=YYYY-MM-DD&ate=YYYY-MM-DD → ações da frente Disparos Marketplace no período.
export async function GET(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const url = new URL(request.url);
  const desde = parseData(url.searchParams.get("desde"));
  const ate = parseData(url.searchParams.get("ate"));
  if (!desde || !ate) return NextResponse.json({ error: "Envie ?desde=AAAA-MM-DD&ate=AAAA-MM-DD" }, { status: 400 });

  const frente = await db.planejamentoFrente.findFirst({
    where: { nome: { equals: "Disparos Marketplace", mode: "insensitive" } },
  });
  if (!frente) return NextResponse.json({ acoes: [] });

  const meses = Array.from(new Set([desde.mes, ate.mes]));
  const acoes = (
    await db.planejamentoAcao.findMany({
      where: { frenteId: frente.id, mes: { in: meses } },
      orderBy: [{ mes: "asc" }, { dia: "asc" }, { ordem: "asc" }],
      select: {
        id: true, mes: true, dia: true, titulo: true, base: true, rdCampanha: true,
        anotacoes: true, feito: true, alerta: true, slackTs: true, slackEnviadoEm: true,
      },
    })
  ).filter((a) => {
    const n = Number(a.mes.replace("-", "")) * 100 + a.dia;
    return n >= desde.num && n <= ate.num;
  });
  return NextResponse.json({ acoes });
}

// PATCH { id, rdCampanha?, base?, feito?, alerta? }
// Travas (o agente nunca apaga o que a Laura escreveu):
// - rdCampanha: só grava se a ação ainda não tem RD.
// - base: se já tem texto, acrescenta embaixo (e não repete o que já está lá).
// - feito: só aceita true (o agente nunca desmarca).
// - alerta: texto do problema, ou null para tirar o alerta que o próprio agente pôs.
export async function PATCH(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Envie { id, ... }" }, { status: 400 });

  const atual = await db.planejamentoAcao.findUnique({ where: { id } });
  if (!atual) return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });

  const data: Record<string, unknown> = {};
  const ignorado: string[] = [];

  if (typeof body.rdCampanha === "string" && body.rdCampanha.trim()) {
    if (atual.rdCampanha?.trim()) ignorado.push("rdCampanha (já preenchido)");
    else data.rdCampanha = body.rdCampanha.trim();
  }
  if (typeof body.base === "string" && body.base.trim()) {
    const novo = body.base.trim();
    const antes = atual.base?.trim() ?? "";
    if (!antes) data.base = novo;
    else if (antes.includes(novo)) ignorado.push("base (já contém esse texto)");
    else data.base = `${antes}\n\n${novo}`;
  }
  if (body.feito === true) data.feito = true;
  if ("alerta" in body) {
    data.alerta = typeof body.alerta === "string" && body.alerta.trim() ? body.alerta.trim().slice(0, 2000) : null;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ success: true, ignorado, acao: atual });
  const acao = await db.planejamentoAcao.update({ where: { id }, data });
  revalidatePath("/planejamento-organico");
  return NextResponse.json({ success: true, ignorado, acao });
}
