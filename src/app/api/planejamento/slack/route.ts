import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { enviarAcaoNoSlack } from "@/lib/planejamento-slack";

// Botão "Enviar no Slack" do /planejamento-organico (com login). A montagem da thread fica em
// @/lib/planejamento-slack, a mesma usada pelo agente das 8h15.
export async function POST(request: Request) {
  try {
    const { acaoId, force, marcacao } = await request.json();
    if (!acaoId) {
      return NextResponse.json({ error: "acaoId é obrigatório" }, { status: 400 });
    }

    const r = await enviarAcaoNoSlack(acaoId, { force, marcacao });
    if (!r.ok) {
      const { status, ...corpo } = r;
      return NextResponse.json(corpo, { status });
    }

    revalidatePath("/planejamento-organico");
    return NextResponse.json({
      success: true,
      canal: r.canal,
      slackTs: r.slackTs,
      slackEnviadoEm: r.slackEnviadoEm,
      aviso: r.aviso,
    });
  } catch (error) {
    console.error("Erro ao enviar planejamento no Slack:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
