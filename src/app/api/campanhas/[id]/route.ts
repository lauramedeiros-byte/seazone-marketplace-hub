import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campanha = await db.campanha.findUnique({ where: { id } });
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }
    return NextResponse.json(campanha);
  } catch (err) {
    console.error("[GET /api/campanhas/:id]", err);
    return NextResponse.json({ error: "Erro ao buscar campanha" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nome, contexto, links, ordem } = body;

    const campanha = await db.campanha.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(contexto !== undefined && { contexto }),
        ...(links !== undefined && { links }),
        ...(ordem !== undefined && { ordem }),
      },
    });

    return NextResponse.json(campanha);
  } catch (err) {
    console.error("[PUT /api/campanhas/:id]", err);
    return NextResponse.json({ error: "Erro ao atualizar campanha" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.campanha.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/campanhas/:id]", err);
    return NextResponse.json({ error: "Erro ao excluir campanha" }, { status: 500 });
  }
}