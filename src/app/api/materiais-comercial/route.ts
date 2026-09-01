import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const PAGINA = "/artefatos-de-consulta/materiais-comercial-revendas";

function texto(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

// Rota interna do hub (começa com "/") não abre em nova aba nem leva ícone de link externo
function ehInterno(url: string): boolean {
  return url.startsWith("/");
}

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case "create": {
        const titulo = texto(data.titulo) || "Novo material";
        const url = texto(data.url);
        if (!url) {
          return NextResponse.json({ error: "Link obrigatório" }, { status: 400 });
        }
        const ordem = await db.materialComercial.count();
        const material = await db.materialComercial.create({
          data: {
            titulo,
            descricao: texto(data.descricao) || null,
            url,
            interno: ehInterno(url),
            ordem,
          },
        });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, material });
      }

      case "update": {
        const { id } = data;
        if (!id) {
          return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
        }
        const patch: Record<string, unknown> = {};
        if ("titulo" in data) patch.titulo = texto(data.titulo) || "Novo material";
        if ("descricao" in data) patch.descricao = texto(data.descricao) || null;
        if ("url" in data) {
          const url = texto(data.url);
          if (!url) {
            return NextResponse.json({ error: "Link obrigatório" }, { status: 400 });
          }
          patch.url = url;
          patch.interno = ehInterno(url);
        }
        const material = await db.materialComercial.update({ where: { id }, data: patch });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, material });
      }

      case "delete": {
        if (!data.id) {
          return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
        }
        await db.materialComercial.delete({ where: { id: data.id } });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true });
      }

      // Move um item uma posição para cima ou para baixo, trocando a ordem com o vizinho
      case "mover": {
        const { id, direcao } = data;
        const lista = await db.materialComercial.findMany({
          orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
        });
        const i = lista.findIndex((m) => m.id === id);
        if (i === -1) {
          return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
        }
        const j = direcao === "cima" ? i - 1 : i + 1;
        if (j < 0 || j >= lista.length) {
          return NextResponse.json({ success: true });
        }
        await db.$transaction([
          db.materialComercial.update({ where: { id: lista[i].id }, data: { ordem: j } }),
          db.materialComercial.update({ where: { id: lista[j].id }, data: { ordem: i } }),
        ]);
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na API materiais-comercial:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
