import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const FORMATOS = ["video-narrado", "video-apresentadora", "estatico"];
const STATUS = ["produzido", "aprovado", "teste"];

type AnexoInput = { tipo?: string; titulo?: string; url?: string };

/** Anexa um roteiro à pasta de um briefing já existente. */
export async function POST(request: Request) {
  try {
    const token = process.env.SPOT_BRIEFING_TOKEN;
    const enviado = request.headers.get("x-spot-token");
    if (token && enviado && enviado !== token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    const body = await request.json();
    const briefingRunId = String(body.briefingRunId ?? "").trim();
    const conteudoMd = String(body.conteudoMd ?? "").trim();
    const formato = String(body.formato ?? "").trim();

    if (!briefingRunId || !conteudoMd || !formato) {
      return NextResponse.json(
        { error: "Informe a pasta do briefing, o formato e o conteúdo do roteiro." },
        { status: 400 }
      );
    }
    if (!FORMATOS.includes(formato)) {
      return NextResponse.json(
        { error: `Formato inválido. Use um destes: ${FORMATOS.join(", ")}.` },
        { status: 400 }
      );
    }

    const status = STATUS.includes(body.status) ? body.status : "teste";

    const run = await db.spotBriefingRun.findUnique({
      where: { id: briefingRunId },
      include: { empreendimento: true, _count: { select: { roteiros: true } } },
    });
    if (!run) {
      return NextResponse.json({ error: "Pasta de briefing não encontrada." }, { status: 404 });
    }

    const codigo =
      body.codigo?.trim() || `R${String(run._count.roteiros + 1).padStart(3, "0")}`;

    const anexos = (Array.isArray(body.anexos) ? body.anexos : [])
      .filter((a: AnexoInput) => a && typeof a.url === "string" && a.url.trim())
      .map((a: AnexoInput) => ({
        tipo: a.tipo === "imagem" ? "imagem" : "link",
        titulo: a.titulo?.trim() || null,
        url: String(a.url).trim(),
      }));

    const roteiro = await db.spotRoteiro.create({
      data: {
        briefingRunId,
        codigo,
        formato,
        status,
        duracao: body.duracao?.trim() || null,
        monica: Boolean(body.monica),
        estrutura: body.estrutura?.trim() || null,
        oQueMuda: body.oQueMuda?.trim() || null,
        derivadoDe: body.derivadoDe?.trim() || null,
        conteudoMd,
        anexos: anexos.length ? { create: anexos } : undefined,
      },
    });

    const slug = run.empreendimento.slug;
    revalidatePath("/briefings");
    revalidatePath(`/briefings/${slug}`);
    revalidatePath(`/briefings/${slug}/${briefingRunId}`);
    return NextResponse.json({ success: true, id: roteiro.id, codigo });
  } catch (error) {
    console.error("Erro ao subir roteiro de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
