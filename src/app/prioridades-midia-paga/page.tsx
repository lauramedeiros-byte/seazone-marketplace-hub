import { db } from "@/lib/db";
import { PrioridadesMidiaPagaClient } from "@/components/prioridades-midia-paga-client";

export const dynamic = "force-dynamic";

export default async function PrioridadesMidiaPagaPage() {
  const meses = await db.midiaPagaMes.findMany({
    orderBy: { mes: "desc" },
    include: {
      priorities: {
        include: {
          empreendimento: true,
          formatos: {
            include: {
              estruturas: {
                include: {
                  variacoes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const empreendimentos = await db.empreendimento.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <PrioridadesMidiaPagaClient
      meses={JSON.parse(JSON.stringify(meses))}
      empreendimentos={JSON.parse(JSON.stringify(empreendimentos))}
    />
  );
}