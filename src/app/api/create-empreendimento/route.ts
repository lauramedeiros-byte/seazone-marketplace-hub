import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    const { nomeEmpreendimento } = await request.json();

    if (!nomeEmpreendimento?.trim()) {
      return NextResponse.json(
        { error: "Nome do empreendimento é obrigatório" },
        { status: 400 }
      );
    }

    const result = await db.repescagemEmpreendimento.create({
      data: {
        nomeEmpreendimento: nomeEmpreendimento.trim(),
        criadoPorId: userId || null,
      },
    });

    revalidatePath("/respescagem");

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Erro ao criar empreendimento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}