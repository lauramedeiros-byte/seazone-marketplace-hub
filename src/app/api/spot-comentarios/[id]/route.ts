import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function revalidarDoComentario(id: string) {
  const comentario = await db.spotComentario.findUnique({
    where: { id },
    select: {
      roteiro: {
        select: {
          briefingRunId: true,
          briefingRun: { select: { empreendimento: { select: { slug: true } } } },
        },
      },
    },
  });
  if (!comentario) return;
  const { briefingRunId, briefingRun } = comentario.roteiro;
  revalidatePath(`/briefings/${briefingRun.empreendimento.slug}/${briefingRunId}`);
}

/** Marca o comentário como resolvido (ou volta atrás), quando o ajuste já foi feito. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existe = await db.spotComentario.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
    }

    await revalidarDoComentario(id);
    const comentario = await db.spotComentario.update({
      where: { id },
      data: {
        ...(body.resolvido !== undefined && { resolvido: Boolean(body.resolvido) }),
        ...(body.texto !== undefined && String(body.texto).trim()
          ? { texto: String(body.texto).trim() }
          : {}),
      },
    });

    return NextResponse.json({ success: true, comentario });
  } catch (error) {
    console.error("Erro ao atualizar comentário de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/** Apaga o comentário de vez — comentário é recado de revisão, não histórico do roteiro. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existe = await db.spotComentario.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
    }

    await revalidarDoComentario(id);
    await db.spotComentario.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir comentário de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
