import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const ACAO_FIELDS = [
  "titulo",
  "base",
  "empreendimentos",
  "whatsapp",
  "email",
  "rdCampanha",
  "anotacoes",
  "links",
  "dia",
  "mes",
  "feito",
] as const;

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      // ── Frentes ──────────────────────────────────────────────────────────
      case "create-frente": {
        const { nome, cor } = data;
        const ordem = await db.planejamentoFrente.count();
        const frente = await db.planejamentoFrente.create({
          data: { nome: nome?.trim() || "Nova frente", cor: cor || "teal", ordem },
        });
        revalidatePath("/planejamento-organico");
        return NextResponse.json({ success: true, frente });
      }

      case "update-frente": {
        const { id, nome, cor } = data;
        const frente = await db.planejamentoFrente.update({
          where: { id },
          data: {
            ...(nome !== undefined ? { nome: nome.trim() } : {}),
            ...(cor !== undefined ? { cor } : {}),
          },
        });
        revalidatePath("/planejamento-organico");
        return NextResponse.json({ success: true, frente });
      }

      case "delete-frente": {
        const { id } = data;
        await db.planejamentoFrente.delete({ where: { id } });
        revalidatePath("/planejamento-organico");
        return NextResponse.json({ success: true });
      }

      // ── Ações ────────────────────────────────────────────────────────────
      case "create-acao": {
        const { frenteId, mes, dia } = data;
        const ordem = await db.planejamentoAcao.count({ where: { frenteId, mes, dia: Number(dia) } });
        const acao = await db.planejamentoAcao.create({
          data: {
            frenteId,
            mes,
            dia: Number(dia),
            titulo: data.titulo?.trim() || "Nova ação",
            base: data.base || null,
            empreendimentos: data.empreendimentos || null,
            whatsapp: data.whatsapp || null,
            email: data.email || null,
            anotacoes: data.anotacoes || null,
            links: data.links ?? [],
            ordem,
          },
        });
        revalidatePath("/planejamento-organico");
        return NextResponse.json({ success: true, acao });
      }

      case "update-acao": {
        const { id, ...rest } = data;
        const patch: Record<string, unknown> = {};
        for (const k of ACAO_FIELDS) {
          if (k in rest) patch[k] = rest[k];
        }
        if ("dia" in patch) patch.dia = Number(patch.dia);
        const acao = await db.planejamentoAcao.update({ where: { id }, data: patch });
        revalidatePath("/planejamento-organico");
        return NextResponse.json({ success: true, acao });
      }

      case "delete-acao": {
        const { id } = data;
        await db.planejamentoAcao.delete({ where: { id } });
        revalidatePath("/planejamento-organico");
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na API planejamento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
