import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enviarAcaoNoSlack } from "@/lib/planejamento-slack";

// Agente das 8h15 (tarefa do Windows na máquina da Laura, pedido de 28/10/2026): no dia do
// disparo, confere as cotas do texto com o Spotômetro e "aperta o botão" Enviar no Slack por ela.
// Fora do Clerk, protegida por x-agente-token. Monta a thread igual ao botão (@/lib/planejamento-slack).
// Travas: só frente Disparos Marketplace, só ação de HOJE (horário de Brasília), nunca reenvia.
function autorizado(request: Request) {
  const esperado = process.env.AGENTE_DISPAROS_TOKEN;
  return !!esperado && request.headers.get("x-agente-token") === esperado;
}

/** Hoje em Brasília -> { mes: "2026-10", dia: 29 } */
function hojeBrasilia() {
  const [ano, mes, dia] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
    .split("-");
  return { mes: `${ano}-${mes}`, dia: Number(dia) };
}

// POST { acaoId } → posta a thread no #entrega_disparos
export async function POST(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { acaoId } = await request.json();
    if (!acaoId) return NextResponse.json({ error: "Envie { acaoId }" }, { status: 400 });

    const acao = await db.planejamentoAcao.findUnique({ where: { id: acaoId }, include: { frente: true } });
    if (!acao) return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
    if (acao.frente.nome.toLowerCase() !== "disparos marketplace") {
      return NextResponse.json({ error: "Ação fora da frente Disparos Marketplace" }, { status: 403 });
    }
    const hoje = hojeBrasilia();
    if (acao.mes !== hoje.mes || acao.dia !== hoje.dia) {
      return NextResponse.json({ error: "O agente só envia ação do dia de hoje" }, { status: 403 });
    }

    const r = await enviarAcaoNoSlack(acaoId); // sem force: nunca reenvia
    if (!r.ok) {
      const { status, ...corpo } = r;
      return NextResponse.json(corpo, { status });
    }
    revalidatePath("/planejamento-organico");
    return NextResponse.json({ success: true, slackTs: r.slackTs, slackEnviadoEm: r.slackEnviadoEm, aviso: r.aviso });
  } catch (error) {
    console.error("Erro no envio do agente:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
