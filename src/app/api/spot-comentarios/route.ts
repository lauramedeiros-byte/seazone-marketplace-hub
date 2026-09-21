import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Comenta um roteiro. É o que o lápis de edição lê depois, para saber o que ajustar. */
export async function POST(request: Request) {
  try {
    const token = process.env.SPOT_BRIEFING_TOKEN;
    const enviado = request.headers.get("x-spot-token");
    if (token && enviado && enviado !== token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    const body = await request.json();
    const roteiroId = String(body.roteiroId ?? "").trim();
    const texto = String(body.texto ?? "").trim();

    if (!roteiroId || !texto) {
      return NextResponse.json({ error: "Informe o roteiro e escreva o comentário." }, { status: 400 });
    }

    const roteiro = await db.spotRoteiro.findUnique({
      where: { id: roteiroId },
      select: {
        briefingRunId: true,
        briefingRun: { select: { empreendimento: { select: { slug: true } } } },
      },
    });
    if (!roteiro) {
      return NextResponse.json({ error: "Roteiro não encontrado." }, { status: 404 });
    }

    const comentario = await db.spotComentario.create({
      data: { roteiroId, texto, autor: body.autor?.trim() || null },
    });

    const slug = roteiro.briefingRun.empreendimento.slug;
    revalidatePath(`/briefings/${slug}/${roteiro.briefingRunId}`);
    return NextResponse.json({ success: true, comentario });
  } catch (error) {
    console.error("Erro ao comentar roteiro de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
