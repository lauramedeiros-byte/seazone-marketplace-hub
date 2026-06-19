import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const analises = await db.analiseClaude.findMany({
      orderBy: { dataAnalise: "desc" },
    });
    return NextResponse.json(analises);
  } catch (err) {
    console.error("[GET /api/analises-claude]", err);
    return NextResponse.json({ error: "Erro ao buscar análises" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { descricao, links, dataAnalise } = body;

    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descrição é obrigatória" }, { status: 400 });
    }

    const analise = await db.analiseClaude.create({
      data: {
        descricao: descricao.trim(),
        links: links || [],
        dataAnalise: new Date(dataAnalise),
      },
    });

    return NextResponse.json(analise, { status: 201 });
  } catch (err) {
    console.error("[POST /api/analises-claude]", err);
    return NextResponse.json({ error: "Erro ao criar análise" }, { status: 500 });
  }
}
