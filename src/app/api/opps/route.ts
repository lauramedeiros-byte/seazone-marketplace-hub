import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case "create": {
        const { semanaId, nomeEmpreendimento, localizacao, preco, condicoes, userId } = data;
        const item = await db.oppItem.create({
          data: {
            semanaId,
            nomeEmpreendimento,
            localizacao: localizacao || null,
            preco: preco || null,
            condicoes: condicoes || null,
            criadoPorId: userId || null,
          },
        });
        return NextResponse.json({ success: true, item });
      }

      case "toggle-destaque": {
        const { id } = data;
        const item = await db.oppItem.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

        // Count current destaques
        const count = await db.oppItem.count({
          where: { semanaId: item.semanaId, destaque: true },
        });

        // If trying to add destaque and already have 2, block
        if (!item.destaque && count >= 2) {
          return NextResponse.json({ error: "Máximo de 2 destaques por semana" }, { status: 400 });
        }

        await db.oppItem.update({
          where: { id },
          data: { destaque: !item.destaque },
        });
        return NextResponse.json({ success: true });
      }

      case "update-justificativa": {
        const { id, justificativa } = data;
        await db.oppItem.update({
          where: { id },
          data: { justificativa },
        });
        return NextResponse.json({ success: true });
      }

      case "update-texto": {
        const { id, field, value } = data;
        await db.oppItem.update({
          where: { id },
          data: { [field]: value },
        });
        return NextResponse.json({ success: true });
      }

      case "delete": {
        const { id } = data;
        await db.oppItem.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na API opps:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}