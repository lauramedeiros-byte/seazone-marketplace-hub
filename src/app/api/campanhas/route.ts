import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const campanhas = await db.campanha.findMany({
      orderBy: { ordem: "asc" },
    });
    return NextResponse.json(campanhas);
  } catch (err) {
    console.error("[GET /api/campanhas]", err);
    return NextResponse.json({ error: "Erro ao buscar campanhas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, contexto, links, ordem } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const campanha = await db.campanha.create({
      data: {
        nome: nome.trim(),
        contexto: contexto || null,
        links: links || [],
        ordem: ordem ?? 0,
      },
    });

    return NextResponse.json(campanha, { status: 201 });
  } catch (err) {
    console.error("[POST /api/campanhas]", err);
    return NextResponse.json({ error: "Erro ao criar campanha" }, { status: 500 });
  }
}