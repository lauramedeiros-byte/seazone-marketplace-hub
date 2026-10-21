import { PropostasClient } from "@/components/propostas-disparo-client";
import { dadosPaginaPropostas } from "@/lib/propostas-disparo";

export const dynamic = "force-dynamic";

// Propostas do agente de disparos (Marketplace). Pendentes e reprovadas sempre; aprovadas,
// substituídas e descartadas dos últimos 30 dias (abas "Aprovadas" e "Histórico").
// ?grupo=comunidade abre direto nas propostas da Comunidade WPP (link do Slack de segunda).
export default async function PropostasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { grupo } = await searchParams;
  const dados = await dadosPaginaPropostas();
  return (
    <PropostasClient
      inicial={JSON.parse(JSON.stringify(dados))}
      grupoInicial={grupo === "comunidade" ? "comunidade" : "disparos"}
    />
  );
}
