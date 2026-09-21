import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { parseBloco, normalizarFormato, normalizarStatus, ehSim, normalizarColagem } from "@/lib/spot-bloco";

const FORMATOS = ["video-narrado", "video-apresentadora", "estatico"];
const STATUS = ["produzido", "aprovado", "teste"];

type AnexoInput = { tipo?: string; titulo?: string; url?: string };

/**
 * Anexa um roteiro à pasta de um briefing já existente.
 *
 * Como no briefing, o corpo pode trazer só `conteudoMd`: formato, status, código,
 * duração, Mônica e a tese saem do cabeçalho entre `---`. Campo mandado solto no JSON
 * ganha do cabeçalho.
 */
export async function POST(request: Request) {
  try {
    const token = process.env.SPOT_BRIEFING_TOKEN;
    const enviado = request.headers.get("x-spot-token");
    if (token && enviado && enviado !== token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    const body = await request.json();
    const briefingRunId = String(body.briefingRunId ?? "").trim();
    const conteudoMd = normalizarColagem(String(body.conteudoMd ?? body.bloco ?? ""));
    const bloco = parseBloco(conteudoMd);
    const doBloco = bloco.campos;

    const formato =
      normalizarFormato(String(body.formato ?? "").trim()) ??
      normalizarFormato(doBloco.formato?.valor) ??
      "";

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

    const status = STATUS.includes(body.status)
      ? body.status
      : normalizarStatus(doBloco.status?.valor) ?? "teste";

    const run = await db.spotBriefingRun.findUnique({
      where: { id: briefingRunId },
      include: { empreendimento: true, _count: { select: { roteiros: true } } },
    });
    if (!run) {
      return NextResponse.json({ error: "Pasta de briefing não encontrada." }, { status: 404 });
    }

    const codigo =
      body.codigo?.trim() ||
      doBloco.codigo?.valor ||
      `R${String(run._count.roteiros + 1).padStart(3, "0")}`;

    const doJson = (Array.isArray(body.anexos) ? body.anexos : [])
      .filter((a: AnexoInput) => a && typeof a.url === "string" && a.url.trim())
      .map((a: AnexoInput) => ({
        tipo: a.tipo === "imagem" ? "imagem" : "link",
        titulo: a.titulo?.trim() || null,
        url: String(a.url).trim(),
      }));
    const doCabecalho = bloco.links
      .filter((l) => !doJson.some((a: { url: string }) => a.url === l.url))
      .map((l) => ({ tipo: "link", titulo: l.titulo, url: l.url }));
    const anexos = [...doJson, ...doCabecalho];

    const monica =
      body.monica !== undefined ? Boolean(body.monica) : ehSim(doBloco.monica?.valor);

    const roteiro = await db.spotRoteiro.create({
      data: {
        briefingRunId,
        codigo,
        formato,
        status,
        duracao: body.duracao?.trim() || doBloco.duracao?.valor || null,
        monica,
        estrutura: body.estrutura?.trim() || doBloco.estrutura?.valor || null,
        oQueMuda: body.oQueMuda?.trim() || doBloco.oQueMuda?.valor || null,
        derivadoDe: body.derivadoDe?.trim() || doBloco.derivadoDe?.valor || null,
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
