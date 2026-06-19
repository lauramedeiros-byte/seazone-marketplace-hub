import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { descricao, links, dataAnalise } = body;

    const analise = await db.analiseClaude.update({
      where: { id },
      data: {
        ...(descricao !== undefined && { descricao: descricao.trim() }),
        ...(links !== undefined && { links }),
        ...(dataAnalise !== undefined && { dataAnalise: new Date(dataAnalise) }),
      },
    });

    return NextResponse.json(analise);
  } catch (err) {
    console.error("[PUT /api/analises-claude/:id]", err);
    return NextResponse.json({ error: "Erro ao atualizar análise" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.analiseClaude.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/analises-claude/:id]", err);
    return NextResponse.json({ error: "Erro ao excluir análise" }, { status: 500 });
  }
}
