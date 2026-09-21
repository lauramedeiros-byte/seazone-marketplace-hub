import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { parseBloco, resumoDoBloco, dataParaIso, normalizarColagem } from "@/lib/spot-bloco";

type AnexoInput = { tipo?: string; titulo?: string; url?: string };

/**
 * Sobe um briefing gerado — cria uma "pasta" nova no empreendimento.
 * Aceita quem está logado no app (form) e também a skill, via cabeçalho
 * x-spot-token quando SPOT_BRIEFING_TOKEN estiver configurado.
 *
 * O corpo pode trazer só `conteudoMd`: o cabeçalho do bloco (entre `---`) informa o
 * empreendimento, a data, o autor, o artefato e os números. O que vier solto no JSON
 * ganha do cabeçalho — é o formulário corrigindo o que a skill escreveu.
 */
export async function POST(request: Request) {
  try {
    const token = process.env.SPOT_BRIEFING_TOKEN;
    const enviado = request.headers.get("x-spot-token");
    if (token && enviado && enviado !== token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    const body = await request.json();
    const conteudoMd = normalizarColagem(String(body.conteudoMd ?? body.bloco ?? ""));
    const bloco = parseBloco(conteudoMd);
    const doBloco = bloco.campos;

    const slug = String(body.slug ?? doBloco.spot?.valor ?? "").trim();

    if (!slug || !conteudoMd) {
      return NextResponse.json(
        { error: "Informe o empreendimento e cole o conteúdo do briefing." },
        { status: 400 }
      );
    }

    const emp = await db.spotEmpreendimento.findUnique({ where: { slug } });
    if (!emp) {
      return NextResponse.json({ error: `Empreendimento "${slug}" não encontrado.` }, { status: 404 });
    }

    const dataBruta = body.geradoEm || dataParaIso(doBloco.geradoEm?.valor);
    const geradoEm = dataBruta ? new Date(dataBruta) : new Date();
    if (Number.isNaN(geradoEm.getTime())) {
      return NextResponse.json({ error: "Data de geração inválida." }, { status: 400 });
    }

    const anexos = (Array.isArray(body.anexos) ? body.anexos : [])
      .filter((a: AnexoInput) => a && typeof a.url === "string" && a.url.trim())
      .map((a: AnexoInput) => ({
        tipo: a.tipo === "imagem" ? "imagem" : "link",
        titulo: a.titulo?.trim() || null,
        url: String(a.url).trim(),
      }));

    const origem = (body.origem ?? doBloco.origem?.valor) === "skill" ? "skill" : "manual";

    const run = await db.spotBriefingRun.create({
      data: {
        empreendimentoId: emp.id,
        geradoEm,
        geradoPor: body.geradoPor?.trim() || doBloco.geradoPor?.valor || null,
        origem,
        conteudoMd,
        resumoJson: body.resumoJson ?? resumoDoBloco(bloco) ?? undefined,
        avisosJson: body.avisosJson ?? undefined,
        artefatoUrl: body.artefatoUrl?.trim() || doBloco.artefatoUrl?.valor || null,
        docsUrl: body.docsUrl?.trim() || doBloco.docsUrl?.valor || null,
        observacao: body.observacao?.trim() || doBloco.observacao?.valor || null,
        anexos: anexos.length ? { create: anexos } : undefined,
      },
    });

    revalidatePath("/briefings");
    revalidatePath(`/briefings/${slug}`);
    return NextResponse.json({ success: true, runId: run.id, slug });
  } catch (error) {
    console.error("Erro ao subir briefing de SPOT:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
