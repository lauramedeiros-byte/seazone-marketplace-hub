import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const PAGINA = "/artefatos-de-consulta/diretorio-pontual";

function texto(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

// Ano da pasta: aceita só um ano plausível; fora disso cai no ano corrente
function anoValido(v: unknown): number {
  const n = Number(v);
  const atual = new Date().getFullYear();
  return Number.isInteger(n) && n >= 2020 && n <= atual + 1 ? n : atual;
}

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case "create": {
        const titulo = texto(data.titulo);
        if (!titulo) {
          return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
        }
        const item = await db.diretorioPontual.create({
          data: {
            ano: anoValido(data.ano),
            titulo,
            url: texto(data.url) || null,
            nota: texto(data.nota) || null,
          },
        });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, item });
      }

      case "update": {
        const { id } = data;
        if (!id) {
          return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
        }
        const patch: Record<string, unknown> = {};
        if ("titulo" in data) {
          const titulo = texto(data.titulo);
          if (!titulo) {
            return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
          }
          patch.titulo = titulo;
        }
        if ("url" in data) patch.url = texto(data.url) || null;
        if ("nota" in data) patch.nota = texto(data.nota) || null;
        if ("ano" in data) patch.ano = anoValido(data.ano);
        const item = await db.diretorioPontual.update({ where: { id }, data: patch });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, item });
      }

      case "delete": {
        if (!data.id) {
          return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
        }
        await db.diretorioPontual.delete({ where: { id: data.id } });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na API diretorio-pontual:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
