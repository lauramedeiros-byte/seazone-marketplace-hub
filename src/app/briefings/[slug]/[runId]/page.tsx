import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BriefingRunClient } from "@/components/briefing-run-client";

export const dynamic = "force-dynamic";

export default async function BriefingRunPage({
  params,
}: {
  params: Promise<{ slug: string; runId: string }>;
}) {
  const { slug, runId } = await params;

  const run = await db.spotBriefingRun.findUnique({
    where: { id: runId },
    include: {
      empreendimento: true,
      roteiros: { orderBy: { codigo: "asc" }, include: { anexos: true } },
      anexos: true,
    },
  });

  if (!run || run.empreendimento.slug !== slug) notFound();

  const maisRecente = await db.spotBriefingRun.findFirst({
    where: { empreendimentoId: run.empreendimentoId },
    orderBy: { geradoEm: "desc" },
    select: { id: true },
  });

  return (
    <BriefingRunClient
      slug={slug}
      ehMaisRecente={maisRecente?.id === run.id}
      empreendimento={{ nome: run.empreendimento.nome, cidade: run.empreendimento.cidade, estado: run.empreendimento.estado }}
      run={{
        id: run.id,
        geradoEm: run.geradoEm.toISOString(),
        geradoPor: run.geradoPor,
        origem: run.origem,
        conteudoMd: run.conteudoMd,
        artefatoUrl: run.artefatoUrl,
        docsUrl: run.docsUrl,
        observacao: run.observacao,
        anexos: run.anexos.map((a) => ({ id: a.id, tipo: a.tipo, titulo: a.titulo, url: a.url })),
      }}
      roteirosInit={run.roteiros.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        formato: r.formato,
        status: r.status,
        duracao: r.duracao,
        monica: r.monica,
        estrutura: r.estrutura,
        oQueMuda: r.oQueMuda,
        derivadoDe: r.derivadoDe,
        conteudoMd: r.conteudoMd,
        anexos: r.anexos.map((a) => ({ id: a.id, tipo: a.tipo, titulo: a.titulo, url: a.url })),
      }))}
    />
  );
}
