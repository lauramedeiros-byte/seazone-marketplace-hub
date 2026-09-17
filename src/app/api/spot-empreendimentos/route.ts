import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cria a "pasta" de um empreendimento novo. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nome = String(body.nome ?? "").trim();
    const cidade = String(body.cidade ?? "").trim();
    const estado = String(body.estado ?? "").trim().toUpperCase();

    if (!nome || !cidade || !estado) {
      return NextResponse.json(
        { error: "Nome, cidade e estado são obrigatórios." },
        { status: 400 }
      );
    }
    if (estado.length !== 2) {
      return NextResponse.json(
        { error: "Use a sigla do estado com 2 letras, por exemplo SC." },
        { status: 400 }
      );
    }

    const slug = slugify(body.slug ? String(body.slug) : nome);
    const jaExiste = await db.spotEmpreendimento.findUnique({ where: { slug } });
    if (jaExiste) {
      return NextResponse.json(
        { error: `Já existe um empreendimento com o endereço "${slug}".` },
        { status: 409 }
      );
    }

    const spotBuildingId =
      body.spotBuildingId === undefined || body.spotBuildingId === null || body.spotBuildingId === ""
        ? null
        : Number(body.spotBuildingId);

    if (spotBuildingId !== null && !Number.isInteger(spotBuildingId)) {
      return NextResponse.json({ error: "O id do SZI precisa ser um número inteiro." }, { status: 400 });
    }

    const criado = await db.spotEmpreendimento.create({
      data: { nome, slug, cidade, estado, spotBuildingId },
    });

    revalidatePath("/briefings");
    return NextResponse.json({ success: true, slug: criado.slug });
  } catch (error) {
    console.error("Erro ao criar empreendimento de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
