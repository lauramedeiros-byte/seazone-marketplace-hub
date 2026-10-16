import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { aprovarProposta, dadosPaginaPropostas, pedirRepasse, reprovarProposta } from "@/lib/propostas-disparo";

// Página /planejamento-organico/propostas (rota protegida pelo Clerk).
// GET → mesmos dados do render; a página consulta enquanto o agente trabalha num pedido.
export async function GET() {
  return NextResponse.json(JSON.parse(JSON.stringify(await dadosPaginaPropostas())));
}

// Ações da Laura na página.
export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();
    switch (action) {
      case "aprovar": {
        const proposta = await aprovarProposta(data.id, data.whatsapp);
        revalidatePath("/planejamento-organico");
        revalidatePath("/planejamento-organico/propostas");
        return NextResponse.json({ success: true, proposta });
      }
      case "reprovar": {
        const proposta = await reprovarProposta(data.id, data.comentario ?? "");
        revalidatePath("/planejamento-organico/propostas");
        return NextResponse.json({ success: true, proposta });
      }
      case "desfazer": {
        // Volta para pendente. Não apaga a ação do planejamento — isso ela faz lá.
        const proposta = await db.propostaDisparo.update({
          where: { id: data.id },
          data: { status: "pendente", decididoEm: null },
        });
        revalidatePath("/planejamento-organico/propostas");
        return NextResponse.json({ success: true, proposta });
      }
      case "gerar-aprendizado": {
        // Sinal para a vigia local rodar o repasse agora (em vez de esperar os 30 min).
        const pedido = await pedirRepasse();
        revalidatePath("/planejamento-organico/propostas");
        return NextResponse.json({ success: true, pedido });
      }
      case "descartar": {
        // Proposta que não serve mais (ex.: a ação dela foi apagada). Sai da fila sem virar aprendizado.
        const proposta = await db.propostaDisparo.update({
          where: { id: data.id },
          data: { status: "descartada", decididoEm: new Date() },
        });
        revalidatePath("/planejamento-organico/propostas");
        return NextResponse.json({ success: true, proposta });
      }
      case "criar-aprendizado": {
        const texto = String(data.texto ?? "").trim();
        if (!texto) return NextResponse.json({ error: "Texto vazio" }, { status: 400 });
        const aprendizado = await db.aprendizadoDisparo.create({ data: { texto } });
        revalidatePath("/planejamento-organico/propostas");
        return NextResponse.json({ success: true, aprendizado });
      }
      case "editar-aprendizado": {
        const aprendizado = await db.aprendizadoDisparo.update({
          where: { id: data.id },
          data: {
            ...(data.texto !== undefined ? { texto: String(data.texto).trim() } : {}),
            ...(data.ativo !== undefined ? { ativo: Boolean(data.ativo) } : {}),
          },
        });
        revalidatePath("/planejamento-organico/propostas");
        return NextResponse.json({ success: true, aprendizado });
      }
      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na API propostas-disparo:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
