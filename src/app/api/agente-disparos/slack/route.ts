import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enviarAcaoNoSlack } from "@/lib/planejamento-slack";

// Agente das 8h15 (tarefa do Windows na máquina da Laura, pedido de 28/10/2026): no dia do
// disparo, confere as cotas do texto com o Spotômetro e "aperta o botão" Enviar no Slack por ela.
// Fora do Clerk, protegida por x-agente-token. Monta a thread igual ao botão (@/lib/planejamento-slack).
// Travas: só frente Disparos Marketplace, só ação de HOJE (horário de Brasília), nunca reenvia.
// Exceção da sexta (Laura, 28/10/2026): sábado, domingo e segunda precisam estar no canal até as 16h de
// sexta, então na sexta a rota aceita também essas três datas (rodada das 14h).
function autorizado(request: Request) {
  const esperado = process.env.AGENTE_DISPAROS_TOKEN;
  return !!esperado && request.headers.get("x-agente-token") === esperado;
}

/** Datas que o agente pode enviar agora (Brasília): hoje; na sexta, também sáb, dom e seg. Formato "2026-10-30". */
function datasPermitidas() {
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const base = new Date(`${hoje}T12:00:00Z`);
  const extras = base.getUTCDay() === 5 ? 3 : 0;
  return Array.from({ length: extras + 1 }, (_, i) =>
    new Date(base.getTime() + i * 86_400_000).toISOString().slice(0, 10)
  );
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
    const data = `${acao.mes}-${String(acao.dia).padStart(2, "0")}`;
    if (!datasPermitidas().includes(data)) {
      return NextResponse.json(
        { error: "O agente só envia ação de hoje (na sexta, também de sábado, domingo e segunda)" },
        { status: 403 }
      );
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
