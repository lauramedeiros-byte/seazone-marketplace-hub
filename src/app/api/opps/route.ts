import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case "create": {
        const { semanaId, nomeEmpreendimento, localizacao, preco, condicoes } = data;
        const item = await db.oppItem.create({
          data: {
            semanaId,
            nomeEmpreendimento,
            localizacao: localizacao || null,
            preco: preco || null,
            condicoes: condicoes || null,
          },
        });
        return NextResponse.json({ success: true, item });
      }

      case "toggle-destaque": {
        const { id } = data;
        const item = await db.oppItem.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

        // Opp marcada como da Mônica não pode ser escolhida pelo marketing
        if (!item.destaque && item.tipoDestaque === "monica") {
          return NextResponse.json({ error: "Opp da Mônica não pode ser escolhida" }, { status: 400 });
        }

        // Count current destaques
        const count = await db.oppItem.count({
          where: { semanaId: item.semanaId, destaque: true },
        });

        // If trying to add destaque and already have 2, block
        if (!item.destaque && count >= 2) {
          return NextResponse.json({ error: "Máximo de 2 escolhidas por semana" }, { status: 400 });
        }

        await db.oppItem.update({
          where: { id },
          data: { destaque: !item.destaque },
        });
        return NextResponse.json({ success: true });
      }

      case "toggle-monica": {
        // Marca/desmarca uma opp como escolha da Mônica (usa o campo tipoDestaque)
        const { id } = data;
        const item = await db.oppItem.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

        const isMonica = item.tipoDestaque === "monica";
        await db.oppItem.update({
          where: { id },
          // ao marcar como Mônica, garante que não fique como escolhida do marketing
          data: { tipoDestaque: isMonica ? null : "monica", destaque: isMonica ? item.destaque : false },
        });
        return NextResponse.json({ success: true });
      }

      case "choose-prev": {
        // Escolhe uma opp da semana anterior: duplica na semana vigente como escolhida
        const { semanaId, sourceId } = data;
        const count = await db.oppItem.count({
          where: { semanaId, destaque: true },
        });
        if (count >= 2) {
          return NextResponse.json({ error: "Máximo de 2 escolhidas por semana" }, { status: 400 });
        }
        const src = await db.oppItem.findUnique({ where: { id: sourceId } });
        if (!src) return NextResponse.json({ error: "Opp de origem não encontrada" }, { status: 404 });

        const item = await db.oppItem.create({
          data: {
            semanaId,
            nomeEmpreendimento: src.nomeEmpreendimento,
            localizacao: src.localizacao,
            preco: src.preco,
            condicoes: src.condicoes,
            destaque: true,
            tipoDestaque: "semana-anterior",
          },
        });
        return NextResponse.json({ success: true, item });
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