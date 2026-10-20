"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Check, Clock, ExternalLink, RefreshCw, Send, X } from "lucide-react";
import { separarNomeECota } from "@/lib/empreendimentos-revenda";

export interface ItemSemanaView {
  id: string;
  nomeEmpreendimento: string;
  cota?: string | null;
  preco: string | null;
  destaque: boolean;
  tipoDestaque: string | null;
  justificativa: string | null;
  origem?: string | null;
  slackStatus?: string | null;
  slackLink?: string | null;
  pedidoTroca?: string | null;
}

export interface SemanaView {
  id: string;
  weekStart: Date | string;
  items: ItemSemanaView[];
}

/** Toques de marketing de cada opp: propostas do agente + ação do planejamento. */
export interface ToqueView {
  titulo: string;
  mes: string;
  dia: number;
  status: string; // pendente | aprovada | reprovada | substituida | descartada
  feito: boolean;
  rdCampanha: string | null;
}

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
function rotuloDia(mes: string, dia: number) {
  const d = new Date(`${mes}-${String(dia).padStart(2, "0")}T12:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${String(dia).padStart(2, "0")}/${mes.slice(5)}`;
}

// até 28/09/2026 o registro usava a semana da escolha; desde 05/10, a de publicação
function publicacao(weekStart: Date | string): Date {
  const d = new Date(weekStart);
  return d.getTime() >= Date.UTC(2026, 9, 5) ? d : new Date(d.getTime() + 7 * 86400000);
}
// weekStart é a segunda à meia-noite "sem fuso" (lida como 00:00 UTC): formatar em UTC
const dm = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

function Passo({ ok, atual, children }: { ok: boolean; atual?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 border ${
        ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : atual ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-white border-gray-200 text-gray-400"
      }`}
    >
      {ok ? <Check className="w-3 h-3" /> : atual ? <Clock className="w-3 h-3" /> : null}
      {children}
    </span>
  );
}

function AndamentoMonica({ i }: { i: ItemSemanaView }) {
  if (i.origem !== "agente") return <span className="text-[11px] text-gray-400">registro manual</span>;
  const s = i.slackStatus ?? "sugerida";
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Passo ok atual={false}>sugerida no #laura-aprovar</Passo>
      <Passo ok={s === "aprovada" || s === "postada"} atual={s === "sugerida"}>sua aprovação</Passo>
      <Passo ok={s === "postada"} atual={s === "aprovada"}>
        postada no #social-media-mkt
      </Passo>
      {i.slackLink && (
        <a href={i.slackLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-700 hover:underline inline-flex items-center gap-0.5">
          thread <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function AndamentoMkt({ i, toques }: { i: ItemSemanaView; toques: ToqueView[] }) {
  if (i.origem !== "agente" && toques.length === 0) return <span className="text-[11px] text-gray-400">registro manual</span>;
  const vivos = toques.filter((t) => t.status !== "substituida" && t.status !== "descartada");
  if (vivos.length === 0) return <span className="text-[11px] text-gray-400">sem proposta ainda</span>;
  return (
    <div className="space-y-0.5">
      {vivos.map((t) => {
        const toque = /2T|2º|T2/i.test(t.titulo) ? "2º toque" : "1º toque";
        return (
          <div key={`${t.mes}-${t.dia}-${t.titulo}`} className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-gray-600 w-[92px] shrink-0">
              {toque} · {rotuloDia(t.mes, t.dia)}
            </span>
            <Passo ok={t.status === "aprovada"} atual={t.status === "pendente"}>
              {t.status === "reprovada" ? "reprovada — o agente refaz" : t.status === "aprovada" ? "aprovada" : "nas propostas"}
            </Passo>
            {t.status === "aprovada" && (
              <Passo ok={t.feito} atual={!t.feito}>
                {t.feito ? "saiu" : "no planejamento"}
              </Passo>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OppsSemana({ semanas, toquesPorItem }: { semanas: SemanaView[]; toquesPorItem: Record<string, ToqueView[]> }) {
  const [verTodas, setVerTodas] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [trocas, setTrocas] = useState<Record<string, string | null>>({});

  const [hoje] = useState(() => Date.now());
  const comOpps = [...semanas]
    .filter((s) => s.items.some((i) => i.destaque || i.tipoDestaque === "monica"))
    .sort((a, b) => publicacao(b.weekStart).getTime() - publicacao(a.weekStart).getTime());
  const visiveis = verTodas ? comOpps : comOpps.slice(0, 4);

  async function pedirTroca(i: ItemSemanaView) {
    const motivo = window.prompt(`Por que trocar ${i.nomeEmpreendimento}${i.cota ? ` ${i.cota}` : ""}? (ex.: cota reservada)`, "cota reservada");
    if (motivo === null) return;
    setOcupado(i.id);
    try {
      const r = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pedir-troca", id: i.id, motivo }),
      });
      if (r.ok) setTrocas((t) => ({ ...t, [i.id]: motivo || "cota indisponível" }));
    } finally {
      setOcupado(null);
    }
  }
  async function cancelarTroca(i: ItemSemanaView) {
    setOcupado(i.id);
    try {
      const r = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancelar-troca", id: i.id }),
      });
      if (r.ok) setTrocas((t) => ({ ...t, [i.id]: null }));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-[12px] text-teal-900">
        <Bot className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          Toda <b>quinta às 8h40</b> o agente escolhe as 4 cotas da semana seguinte (2 Mônica + 2 marketing), todas de
          empreendimentos há 4+ semanas fora. As da <b>Mônica</b> vão para você validar no <b>#laura-aprovar</b> e, aprovadas,
          são postadas no <b>#social-media-mkt</b>. As de <b>marketing</b> chegam na{" "}
          <a href="/planejamento-organico/propostas" className="underline font-medium">página de propostas</a> (1º toque seg/ter, 2º
          toque qui/sex). Cota morreu antes de publicar? Use <b>Trocar cota</b>.
        </p>
      </div>

      {visiveis.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma semana com opps ainda.</CardContent>
        </Card>
      )}

      {visiveis.map((s) => {
        const pub = publicacao(s.weekStart);
        const fimSemana = pub.getTime() + 7 * 86400000;
        const aberta = fimSemana > hoje; // ainda dá para trocar
        const doAgente = s.items.some((i) => i.origem === "agente");
        const itens = s.items
          .filter((i) => i.destaque || i.tipoDestaque === "monica")
          .sort((a, b) => (a.tipoDestaque === "monica" ? 0 : 1) - (b.tipoDestaque === "monica" ? 0 : 1));
        return (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                Semana de {dm(pub)}
                {pub.getTime() <= hoje && hoje < fimSemana && <Badge variant="success">no ar</Badge>}
                {pub.getTime() > hoje && <Badge variant="warning">próxima</Badge>}
                {doAgente ? (
                  <span className="text-[11px] font-normal text-teal-700 inline-flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> escolhida pelo agente
                  </span>
                ) : (
                  <span className="text-[11px] font-normal text-gray-400">registro manual</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              {itens.map((i) => {
                const lido = separarNomeECota(i.nomeEmpreendimento);
                const cota = i.cota ?? lido.cota;
                const troca = i.id in trocas ? trocas[i.id] : i.pedidoTroca ?? null;
                const monica = i.tipoDestaque === "monica";
                return (
                  <div key={i.id} className="py-2.5 grid grid-cols-1 md:grid-cols-[1.3fr_2fr_auto] gap-2 items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={monica ? "border-purple-200 text-purple-700" : "border-teal-200 text-teal-700"}>
                          {monica ? "Mônica" : "mkt"}
                        </Badge>
                        <span className="text-[13px] font-medium text-gray-900">{lido.empreendimento ?? lido.nomeLimpo}</span>
                        {cota && <span className="font-mono text-[10.5px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">{cota}</span>}
                        {i.preco && <span className="text-[12px] text-gray-500">{i.preco}</span>}
                      </div>
                      {i.justificativa && <p className="mt-1 text-[11.5px] text-gray-500 line-clamp-3">{i.justificativa}</p>}
                    </div>
                    <div>{monica ? <AndamentoMonica i={i} /> : <AndamentoMkt i={i} toques={toquesPorItem[i.id] ?? []} />}</div>
                    <div className="flex md:justify-end">
                      {troca ? (
                        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] text-amber-900">
                          <RefreshCw className="w-3 h-3" /> Troca pedida: {troca}
                          <button onClick={() => cancelarTroca(i)} disabled={ocupado === i.id} className="ml-1 text-amber-700 hover:text-amber-900" title="Cancelar">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        aberta && (
                          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => pedirTroca(i)} disabled={ocupado === i.id}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Trocar cota
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {comOpps.length > 4 && (
        <button onClick={() => setVerTodas((v) => !v)} className="text-[12px] font-medium text-teal-700 hover:underline">
          {verTodas ? "ver menos" : `ver todas as semanas (${comOpps.length})`}
        </button>
      )}

      <p className="text-[11px] text-gray-400 flex items-center gap-1">
        <Send className="w-3 h-3" /> O resultado de cada opp (levantadas, reuniões, venda) está na aba Desempenho.
      </p>
    </div>
  );
}
