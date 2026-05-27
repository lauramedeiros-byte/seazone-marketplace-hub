import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get the first board (there's only one board)
    const board = await db.lostBoard.findFirst({
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json(board?.boardData || null);
  } catch (error) {
    console.error("Erro ao carregar board:", error);
    return NextResponse.json(null);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groups, abordagens } = body;

    // Delete existing boards and create new one (upsert pattern)
    await db.lostBoard.deleteMany();

    const board = await db.lostBoard.create({
      data: {
        boardData: { groups, abordagens },
      },
    });

    return NextResponse.json({ success: true, board });
  } catch (error) {
    console.error("Erro ao salvar board:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
