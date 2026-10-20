import { Bot, CheckCircle2, MessageSquare, RefreshCw, Send, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Aba "Como funciona" de /opps-da-semana: o fluxo com o agente das opps (desde 20/10/2026).
// Regras completas do agente: ~/projects/disparos/agente-opps-semana/REGRAS.md
const PASSOS: { icon: LucideIcon; titulo: string; quando: string; texto: ReactNode }[] = [
  {
    icon: Bot,
    titulo: "O agente escolhe as 4 cotas",
    quando: "quinta, 8h40",
    texto: (
      <>
        Lê o catálogo vivo de revendas e escolhe as cotas da <b>semana seguinte</b>: 2 para a Mônica e 2 para o marketing
        (só revezamento). <b>Todas</b> de empreendimentos há 4+ semanas fora da opp da semana. Fora: Imbassaí, Barra Spot e
        Jurerê Spot; Trancoso e Lagoa só se fizer sentido, sinalizados. Cada cota passa na regra do combo (um critério de
        preço e um de atratividade) e pesa o que deu resultado na aba Desempenho. Empreendimento novo em revenda é avisado
        com 🆕.
      </>
    ),
  },
  {
    icon: MessageSquare,
    titulo: "Mônica: você valida no Slack",
    quando: "quinta de manhã",
    texto: (
      <>
        O pacote (as 4 cotas com [Monica]/[mkt] e 3 versões de texto para cada cota da Mônica) chega no{" "}
        <b>#laura-aprovar</b>. Reaja com ✅ para aprovar ou responda na thread o que ajustar. Aprovado, o agente posta{" "}
        <b>revendas - opps da semana DD/MM</b> no <b>#social-media-mkt</b> e o pacote numa thread. As imagens (Canva)
        continuam com você.
      </>
    ),
  },
  {
    icon: CheckCircle2,
    titulo: "Marketing: você aprova nas propostas",
    quando: "até domingo",
    texto: (
      <>
        As 4 mensagens de WhatsApp (opp 1: 1º toque seg + 2º toque qui · opp 2: 1º toque ter + 2º toque sex) chegam na{" "}
        <a href="/planejamento-organico/propostas" className="text-teal-700 underline">
          página de propostas
        </a>{" "}
        com o selo <b>Opp da semana</b>. Aprovou, vai para o planejamento orgânico. Reprovou com comentário, o agente refaz e
        aprende.
      </>
    ),
  },
  {
    icon: RefreshCw,
    titulo: "Cota morreu? Trocar cota",
    quando: "a qualquer momento",
    texto: (
      <>
        Na aba <b>Semana</b>, o botão <b>Trocar cota</b> pede ao agente outra cota no lugar (mesmas regras). Mônica: o pacote
        novo volta ao #laura-aprovar. Marketing: as mensagens pendentes da cota antiga saem e as novas entram nas propostas.
      </>
    ),
  },
  {
    icon: Send,
    titulo: "Disparo",
    quando: "seg a sex",
    texto: <>Segue o fluxo de sempre do planejamento: Slack no #entrega_disparos e conferência do RD campanha às 17h30.</>,
  },
  {
    icon: TrendingUp,
    titulo: "Resultado",
    quando: "todo dia, 7h",
    texto: (
      <>
        A aba <b>Desempenho</b> se atualiza sozinha: levantadas, reuniões e se a cota vendeu em até 30 dias. O agente usa esses
        números na escolha da quinta seguinte.
      </>
    ),
  },
];

export function ComoFunciona() {
  return (
    <ol className="space-y-3">
      {PASSOS.map((p, i) => (
        <li key={p.titulo} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <p.icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {i + 1}. {p.titulo} <span className="ml-1 text-[11px] font-normal text-gray-400">{p.quando}</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{p.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
