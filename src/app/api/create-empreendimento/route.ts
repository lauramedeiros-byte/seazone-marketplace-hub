import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { nomeEmpreendimento } = await request.json();

    if (!nomeEmpreendimento?.trim()) {
      return NextResponse.json(
        { error: "Nome do empreendimento é obrigatório" },
        { status: 400 }
      );
    }

    console.log("Criando empreendimento:", nomeEmpreendimento);

    const result = await db.repescagemEmpreendimento.create({
      data: {
        nomeEmpreendimento: nomeEmpreendimento.trim(),
      },
    });

    console.log("Criado com ID:", result.id);

    revalidatePath("/respescagem");

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Erro ao criar empreendimento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}