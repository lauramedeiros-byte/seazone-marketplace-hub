import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BriefingSpotClient } from "@/components/briefing-spot-client";

export const dynamic = "force-dynamic";

export default async function BriefingSpotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const emp = await db.spotEmpreendimento.findUnique({
    where: { slug },
    include: {
      briefings: {
        orderBy: { geradoEm: "desc" },
        include: {
          roteiros: { select: { id: true, formato: true, status: true }, orderBy: { codigo: "asc" } },
          _count: { select: { anexos: true } },
        },
      },
    },
  });

  if (!emp) notFound();

  return (
    <BriefingSpotClient
      empreendimento={{ nome: emp.nome, slug: emp.slug, cidade: emp.cidade, estado: emp.estado }}
      pastasInit={emp.briefings.map((b) => ({
        id: b.id,
        geradoEm: b.geradoEm.toISOString(),
        geradoPor: b.geradoPor,
        origem: b.origem,
        artefatoUrl: b.artefatoUrl,
        docsUrl: b.docsUrl,
        observacao: b.observacao,
        totalAnexos: b._count.anexos,
        roteiros: b.roteiros,
      }))}
    />
  );
}
