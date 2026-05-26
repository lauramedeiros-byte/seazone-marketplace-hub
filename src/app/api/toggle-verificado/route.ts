import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { id, verificado } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await db.repescagemNumero.update({
      where: { id },
      data: {
        verificado,
        dataVerificado: verificado ? new Date() : null,
      },
    });

    revalidatePath("/respescagem");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao toggle verificado:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}