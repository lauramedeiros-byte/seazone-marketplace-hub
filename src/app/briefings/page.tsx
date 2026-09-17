import { db } from "@/lib/db";
import { BriefingsClient } from "@/components/briefings-client";

export const dynamic = "force-dynamic";

export default async function BriefingsPage() {
  const registros = await db.spotEmpreendimento.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    include: {
      briefings: {
        orderBy: { geradoEm: "desc" },
        select: { geradoEm: true, _count: { select: { roteiros: true } } },
      },
    },
  });

  const empreendimentos = registros.map((e) => ({
    id: e.id,
    nome: e.nome,
    slug: e.slug,
    cidade: e.cidade,
    estado: e.estado,
    totalBriefings: e.briefings.length,
    totalRoteiros: e.briefings.reduce((soma, b) => soma + b._count.roteiros, 0),
    ultimoBriefing: e.briefings[0]?.geradoEm?.toISOString() ?? null,
  }));

  return <BriefingsClient empreendimentosInit={empreendimentos} />;
}
