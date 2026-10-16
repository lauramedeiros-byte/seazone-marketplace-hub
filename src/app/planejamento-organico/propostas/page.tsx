import { db } from "@/lib/db";
import { PropostasClient } from "@/components/propostas-disparo-client";

export const dynamic = "force-dynamic";

// Propostas do agente de disparos (Marketplace). Mostra a partir de ontem
// e todas as reprovadas que ainda esperam substituta.
export default async function PropostasPage() {
  const ontem = new Date(Date.now() - 86400000 - 3 * 3600000); // BRT
  const chaveOntem = ontem.toISOString().slice(0, 10);
  const [propostas, aprendizados] = await Promise.all([
    db.propostaDisparo.findMany({ orderBy: [{ mes: "asc" }, { dia: "asc" }, { ordem: "asc" }] }),
    db.aprendizadoDisparo.findMany({ orderBy: { criadoEm: "desc" } }),
  ]);
  const visiveis = propostas.filter(
    (p) => `${p.mes}-${String(p.dia).padStart(2, "0")}` >= chaveOntem || p.status === "reprovada"
  );
  return (
    <PropostasClient
      propostasInit={JSON.parse(JSON.stringify(visiveis))}
      aprendizadosInit={JSON.parse(JSON.stringify(aprendizados))}
    />
  );
}
