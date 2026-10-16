import { PropostasClient } from "@/components/propostas-disparo-client";
import { dadosPaginaPropostas } from "@/lib/propostas-disparo";

export const dynamic = "force-dynamic";

// Propostas do agente de disparos (Marketplace). Pendentes e reprovadas sempre; aprovadas,
// substituídas e descartadas dos últimos 30 dias (abas "Aprovadas" e "Histórico").
export default async function PropostasPage() {
  const dados = await dadosPaginaPropostas();
  return <PropostasClient inicial={JSON.parse(JSON.stringify(dados))} />;
}
