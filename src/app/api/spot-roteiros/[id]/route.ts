import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { parseBloco, normalizarFormato, normalizarStatus, ehSim, normalizarColagem } from "@/lib/spot-bloco";

const FORMATOS = ["video-narrado", "video-apresentadora", "estatico"];
const STATUS = ["produzido", "aprovado", "teste"];

/** Revalida as três telas que mostram este roteiro. */
async function revalidarDoRoteiro(id: string) {
  const roteiro = await db.spotRoteiro.findUnique({
    where: { id },
    select: { briefingRunId: true, briefingRun: { select: { empreendimento: { select: { slug: true } } } } },
  });
  if (!roteiro) return;
  const slug = roteiro.briefingRun.empreendimento.slug;
  revalidatePath("/briefings");
  revalidatePath(`/briefings/${slug}`);
  revalidatePath(`/briefings/${slug}/${roteiro.briefingRunId}`);
}

/**
 * Edita um roteiro (o lápis) ou restaura um que foi excluído.
 *
 * Quem manda o conteúdo inteiro com o cabeçalho `---` tem os campos relidos dali,
 * igual na criação; campo mandado solto no JSON ganha do cabeçalho.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const atual = await db.spotRoteiro.findUnique({ where: { id } });
    if (!atual) {
      return NextResponse.json({ error: "Roteiro não encontrado." }, { status: 404 });
    }

    // restaurar o que foi excluído
    if (body.restaurar === true) {
      await db.spotRoteiro.update({
        where: { id },
        data: { arquivadoEm: null, arquivadoPor: null },
      });
      await revalidarDoRoteiro(id);
      return NextResponse.json({ success: true, restaurado: true });
    }

    const conteudoMd =
      body.conteudoMd !== undefined ? normalizarColagem(String(body.conteudoMd)) : atual.conteudoMd;
    if (!conteudoMd) {
      return NextResponse.json({ error: "O conteúdo do roteiro não pode ficar vazio." }, { status: 400 });
    }

    const doBloco = parseBloco(conteudoMd).campos;

    const formato =
      normalizarFormato(body.formato) ?? normalizarFormato(doBloco.formato?.valor) ?? atual.formato;
    if (!FORMATOS.includes(formato)) {
      return NextResponse.json(
        { error: `Formato inválido. Use um destes: ${FORMATOS.join(", ")}.` },
        { status: 400 }
      );
    }

    const status = STATUS.includes(body.status)
      ? body.status
      : normalizarStatus(doBloco.status?.valor) ?? atual.status;

    // String vazia vinda do formulário significa "apagar este campo", não "não mexer".
    const texto = (chave: keyof typeof body, doCabecalho: string | undefined, antigo: string | null) => {
      if (body[chave] === undefined) return antigo;
      const limpo = String(body[chave]).trim();
      return limpo || doCabecalho || null;
    };

    const roteiro = await db.spotRoteiro.update({
      where: { id },
      data: {
        conteudoMd,
        formato,
        status,
        codigo: body.codigo?.trim() || atual.codigo,
        duracao: texto("duracao", doBloco.duracao?.valor, atual.duracao),
        monica: body.monica !== undefined ? Boolean(body.monica) : ehSim(doBloco.monica?.valor) || atual.monica,
        estrutura: texto("estrutura", doBloco.estrutura?.valor, atual.estrutura),
        oQueMuda: texto("oQueMuda", doBloco.oQueMuda?.valor, atual.oQueMuda),
        derivadoDe: texto("derivadoDe", doBloco.derivadoDe?.valor, atual.derivadoDe),
      },
    });

    await revalidarDoRoteiro(id);
    return NextResponse.json({ success: true, id: roteiro.id });
  } catch (error) {
    console.error("Erro ao editar roteiro de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Exclui o roteiro — sem apagar. Ele sai da lista, guarda quem excluiu e quando, e
 * pode voltar pelo botão de restaurar. Roteiro reprovado é informação: some da tela,
 * não da história.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const por = url.searchParams.get("por");

    const existe = await db.spotRoteiro.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      return NextResponse.json({ error: "Roteiro não encontrado." }, { status: 404 });
    }

    await db.spotRoteiro.update({
      where: { id },
      data: { arquivadoEm: new Date(), arquivadoPor: por?.trim() || null },
    });

    await revalidarDoRoteiro(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir roteiro de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
