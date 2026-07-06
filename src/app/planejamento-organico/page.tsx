import { db } from "@/lib/db";
import { PlanejamentoClient } from "@/components/planejamento-client";

export const dynamic = "force-dynamic";

export default async function PlanejamentoPage() {
  const [frentes, acoes] = await Promise.all([
    db.planejamentoFrente.findMany({ orderBy: { ordem: "asc" } }),
    db.planejamentoAcao.findMany({ orderBy: [{ dia: "asc" }, { ordem: "asc" }] }),
  ]);

  return <PlanejamentoClient frentesInit={frentes} acoesInit={acoes} />;
}
