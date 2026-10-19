"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, Undo2, Lightbulb, Users, Building2, Plus, Sparkles, Loader2, AlertTriangle, Trash2, ExternalLink,
  Bot, Inbox, CheckCircle2, History, BookOpen, Clock, MessageSquare, Send, CalendarCheck, Target, Rocket,
  ArrowRight, ChevronDown, Database, Pencil,
} from "lucide-react";

interface Proposta {
  id: string;
  mes: string;
  dia: number;
  ordem: number;
  titulo: string;
  base: string | null;
  contatos: number | null;
  empreendimentos: string | null;
  whatsapp: string;
  racional: string | null;
  status: "pendente" | "aprovada" | "reprovada" | "substituida" | "descartada";
  comentario: string | null;
  substituiId: string | null;
  acaoExistenteId: string | null;
  acaoId: string | null;
  acaoApagada: boolean;
  decididoEm: string | null;
}
interface Aprendizado {
  id: string;
  texto: string;
  ativo: boolean;
  criadoEm: string;
}
interface Pedido {
  id: string;
  status: "pendente" | "andamento" | "feito" | "erro";
  mensagem: string | null;
  criadoEm: string;
  iniciadoEm: string | null;
  concluidoEm: string | null;
}
interface Dados {
  propostas: Proposta[];
  aprendizados: Aprendizado[];
  pedido: Pedido | null;
}

type Aba = "decidir" | "aprovadas" | "historico" | "aprendizados" | "como-funciona";

const META_DIA = 4000;
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
function rotuloDia(mes: string, dia: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1, dia);
  return `${DIAS_SEMANA[d.getDay()]}, ${String(dia).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}
const chaveDia = (p: Proposta) => `${p.mes}-${String(p.dia).padStart(2, "0")}`;
const hora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
const num = (n: number) => n.toLocaleString("pt-BR");
const somaContatos = (lista: Proposta[]) => lista.reduce((s, p) => s + (p.contatos ?? 0), 0);

function agrupar(lista: Proposta[], desc = false) {
  const g = new Map<string, Proposta[]>();
  for (const p of lista) g.set(chaveDia(p), [...(g.get(chaveDia(p)) ?? []), p]);
  return [...g.entries()].sort(([a], [b]) => (desc ? b.localeCompare(a) : a.localeCompare(b)));
}

// "Campeche Spot, Santinho Spot" → ["Campeche Spot", "Santinho Spot"]
const spots = (s: string | null) =>
  (s ?? "").split(/\s*[,;·|]\s*|\s+\+\s+/).map((x) => x.trim()).filter(Boolean);

async function api(body: Record<string, unknown>) {
  const r = await fetch("/api/propostas-disparo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Erro");
  return j;
}

export function PropostasClient({ inicial }: { inicial: Dados }) {
  const [propostas, setPropostas] = useState(inicial.propostas);
  const [aprendizados, setAprendizados] = useState(inicial.aprendizados);
  const [pedido, setPedido] = useState(inicial.pedido);
  const [aba, setAba] = useState<Aba>("decidir");
  const [copias, setCopias] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [reprovando, setReprovando] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [novoAprendizado, setNovoAprendizado] = useState("");

  const recarregar = useCallback(async () => {
    const r = await fetch("/api/propostas-disparo", { cache: "no-store" });
    if (!r.ok) return;
    const d: Dados = await r.json();
    setPropostas(d.propostas);
    setAprendizados(d.aprendizados);
    setPedido(d.pedido);
  }, []);

  // Enquanto o agente trabalha num pedido, a página se atualiza sozinha.
  const pedidoAberto = pedido?.status === "pendente" || pedido?.status === "andamento";
  useEffect(() => {
    if (!pedidoAberto) return;
    const t = setInterval(recarregar, 15000);
    return () => clearInterval(t);
  }, [pedidoAberto, recarregar]);

  const decidir = useMemo(() => propostas.filter((p) => p.status === "pendente" || p.status === "reprovada"), [propostas]);
  const aprovadas = useMemo(() => propostas.filter((p) => p.status === "aprovada"), [propostas]);
  const historico = useMemo(
    () => propostas.filter((p) => p.status === "substituida" || p.status === "descartada"),
    [propostas]
  );
  const pendentes = decidir.filter((p) => p.status === "pendente");
  const reprovadas = decidir.filter((p) => p.status === "reprovada");
  const ativos = aprendizados.filter((a) => a.ativo).length;

  async function agir(id: string, body: Record<string, unknown>) {
    setSalvando(id);
    setErro(null);
    try {
      await api({ id, ...body });
      if (body.action === "reprovar") setReprovando(null);
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(null);
    }
  }

  async function gerarAprendizado() {
    setSalvando("pedido");
    setErro(null);
    try {
      const j = await api({ action: "gerar-aprendizado" });
      setPedido(j.pedido);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(null);
    }
  }

  async function salvarAprendizado(id: string, patch: Partial<Aprendizado>) {
    try {
      const j = await api({ action: "editar-aprendizado", id, ...patch });
      setAprendizados((a) => a.map((x) => (x.id === id ? j.aprendizado : x)));
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  async function criarAprendizado() {
    if (!novoAprendizado.trim()) return;
    try {
      const j = await api({ action: "criar-aprendizado", texto: novoAprendizado });
      setAprendizados((a) => [j.aprendizado, ...a]);
      setNovoAprendizado("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  const ABAS: { id: Aba; label: string; icon: typeof Inbox; n?: number }[] = [
    { id: "decidir", label: "Para decidir", icon: Inbox, n: decidir.length },
    { id: "aprovadas", label: "Aprovadas", icon: CheckCircle2, n: aprovadas.length },
    { id: "historico", label: "Histórico", icon: History, n: historico.length },
    { id: "aprendizados", label: "Aprendizados", icon: Lightbulb, n: ativos },
    { id: "como-funciona", label: "Como funciona", icon: BookOpen },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton />

      {/* Cabeçalho */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-blue-50/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="rounded-xl bg-blue-600 p-3 text-white shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Agente de disparos · Marketplace</div>
            <h1 className="text-2xl font-bold text-gray-900">Propostas de disparo</h1>
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">
              Todo dia útil às 14h o agente propõe os disparos do dia seguinte. Você aprova (vai direto para o
              planejamento) ou reprova com um comentário (vira aprendizado e ele refaz).{" "}
              <button onClick={() => setAba("como-funciona")} className="font-medium text-blue-700 hover:underline">
                Ver passo a passo →
              </button>
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Indicador
            icon={Inbox}
            cor="text-amber-600 bg-amber-50"
            valor={num(pendentes.length)}
            rotulo="aguardando seu OK"
            detalhe={reprovadas.length ? `+ ${reprovadas.length} reprovada${reprovadas.length > 1 ? "s" : ""} com o agente` : undefined}
          />
          <Indicador
            icon={Users}
            cor="text-blue-600 bg-blue-50"
            valor={num(somaContatos(pendentes))}
            rotulo="contatos nas pendentes"
          />
          <Indicador
            icon={CheckCircle2}
            cor="text-green-600 bg-green-50"
            valor={num(aprovadas.length)}
            rotulo="aprovadas em 30 dias"
            detalhe={aprovadas.length ? `${num(somaContatos(aprovadas))} contatos` : undefined}
          />
          <Indicador icon={Lightbulb} cor="text-violet-600 bg-violet-50" valor={num(ativos)} rotulo="aprendizados ativos" />
        </div>
      </div>

      {/* Abas */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {ABAS.map((a) => {
          const Icon = a.icon;
          const ativa = aba === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                ativa ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {a.label}
              {a.n !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    a.id === "decidir" && a.n > 0 ? "bg-amber-200 text-amber-900" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {a.n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {erro && (
        <div className="mb-4 flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {erro}
        </div>
      )}

      {aba === "decidir" && (
        <>
          <PainelPedido
            pedido={pedido}
            reprovadas={reprovadas.length}
            ocupado={salvando === "pedido"}
            onGerar={gerarAprendizado}
          />

          {decidir.length === 0 && (
            <Vazio icon={CalendarCheck} titulo="Tudo decidido por aqui">
              A próxima rodada do agente sai às 14h. Na sexta ele já propõe sábado, domingo e segunda.
            </Vazio>
          )}

          {agrupar(decidir).map(([k, lista]) => {
            const somaPend = somaContatos(lista.filter((p) => p.status === "pendente"));
            const jaAprovados = somaContatos(aprovadas.filter((p) => chaveDia(p) === k));
            return (
              <section key={k} className="mb-10">
                <CabecalhoDia mes={lista[0].mes} dia={lista[0].dia} pendentes={somaPend} aprovados={jaAprovados} />
                <div className="space-y-5">
                  {lista.map((p) =>
                    p.status === "reprovada" ? (
                      <CardReprovada key={p.id} p={p} ocupado={salvando === p.id} onDesfazer={() => agir(p.id, { action: "desfazer" })} />
                    ) : (
                      <article key={p.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 border-l-4 border-amber-400 px-5 py-3 border-b border-b-gray-100">
                          <h3 className="font-semibold text-gray-900 flex-1 min-w-0">{p.titulo}</h3>
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Aguardando seu OK
                          </span>
                        </div>
                        {p.acaoApagada && (
                          <div className="mx-5 mt-4 flex gap-2 rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm text-amber-900">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                              Esta proposta completava uma ação que você <b>apagou do planejamento</b>. Se aprovar,
                              ela vira uma ação nova nesse dia (com este título). Se o dia já está do jeito que você
                              quer, descarte.
                            </span>
                          </div>
                        )}
                        <div className="p-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-5">
                          <Detalhes p={p} />
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                              <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
                                <MessageSquare className="w-3.5 h-3.5" /> Mensagem do WhatsApp
                              </span>
                              <span className="inline-flex items-center gap-1 text-gray-400">
                                <Pencil className="w-3 h-3" /> pode ajustar antes de aprovar
                              </span>
                            </div>
                            <div className="rounded-xl bg-[#efeae2] p-3">
                              <Textarea
                                className="min-h-[280px] text-sm bg-[#dcf8c6]/70 border-[#c8e6b0] rounded-lg shadow-sm focus-visible:ring-green-500"
                                value={copias[p.id] ?? p.whatsapp}
                                onChange={(e) => setCopias((c) => ({ ...c, [p.id]: e.target.value }))}
                              />
                            </div>
                            {copias[p.id] !== undefined && copias[p.id] !== p.whatsapp && (
                              <div className="mt-1 text-xs text-blue-700">Você editou a mensagem; a versão editada é a que vai para o planejamento.</div>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">
                          {reprovando !== p.id ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                disabled={salvando === p.id}
                                onClick={() => agir(p.id, { action: "aprovar", whatsapp: copias[p.id] })}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {salvando === p.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                {p.acaoApagada ? "Aprovar como ação nova" : "Aprovar e mandar para o planejamento"}
                              </Button>
                              <Button variant="outline" disabled={salvando === p.id} onClick={() => setReprovando(p.id)}>
                                <X className="w-4 h-4 mr-1" /> Reprovar / pedir ajuste
                              </Button>
                              {p.acaoApagada && (
                                <Button variant="ghost" disabled={salvando === p.id} onClick={() => agir(p.id, { action: "descartar" })}>
                                  <Trash2 className="w-4 h-4 mr-1" /> Descartar
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-600">
                                O que não ficou legal? O comentário vira um aprendizado que o agente segue nas próximas rodadas.
                              </div>
                              <Textarea
                                autoFocus
                                className="bg-white"
                                placeholder="Ex.: troque o SPOT, Urubici não converte em lost com opp · para hóspede de SP ofereça SPOT pronto · tom muito formal · não citar 3 cotas"
                                value={comentarios[p.id] ?? ""}
                                onChange={(e) => setComentarios((c) => ({ ...c, [p.id]: e.target.value }))}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  disabled={salvando === p.id || !(comentarios[p.id] ?? "").trim()}
                                  onClick={async () => {
                                    await agir(p.id, { action: "reprovar", comentario: comentarios[p.id] });
                                    await gerarAprendizado();
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Sparkles className="w-4 h-4 mr-1" /> Reprovar e refazer agora
                                </Button>
                                <Button
                                  variant="outline"
                                  disabled={salvando === p.id || !(comentarios[p.id] ?? "").trim()}
                                  onClick={() => agir(p.id, { action: "reprovar", comentario: comentarios[p.id] })}
                                  title="Para reprovar várias e mandar refazer todas juntas no fim"
                                >
                                  Só reprovar (vou comentar outras)
                                </Button>
                                <Button variant="ghost" onClick={() => setReprovando(null)}>Cancelar</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>
            );
          })}
        </>
      )}

      {aba === "aprovadas" && (
        <ListaCompacta
          grupos={agrupar(aprovadas, true)}
          vazio="Nenhuma proposta aprovada nos últimos 30 dias."
          cor="border-l-green-500"
          renderAcoes={(p) => (
            <>
              <a
                href="/planejamento-organico"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ver no planejamento
              </a>
              <Button variant="ghost" size="sm" disabled={salvando === p.id} onClick={() => agir(p.id, { action: "desfazer" })}>
                <Undo2 className="w-4 h-4 mr-1" /> Voltar para pendente
              </Button>
            </>
          )}
          selo={() => (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              <Check className="w-3 h-3" /> No planejamento
            </span>
          )}
        />
      )}

      {aba === "historico" && (
        <ListaCompacta
          grupos={agrupar(historico, true)}
          vazio="Nada no histórico dos últimos 30 dias."
          cor="border-l-gray-300"
          selo={(p) =>
            p.status === "substituida" ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Substituída por outra versão</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Descartada</span>
            )
          }
        />
      )}

      {aba === "aprendizados" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Aprendizados do agente</h2>
              <p className="text-sm text-gray-600">
                O agente lê esta lista antes de criar qualquer proposta e segue cada regra em todas as
                escolhas: base, recorte, SPOT/cota, tamanho do lote, CTA e texto. Desmarque o que não vale mais.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mb-5">
            <Textarea
              placeholder="Escrever uma regra direto (ex.: hóspede de SP: citar distância do aeroporto)"
              value={novoAprendizado}
              onChange={(e) => setNovoAprendizado(e.target.value)}
              className="min-h-[44px]"
            />
            <Button onClick={criarAprendizado} disabled={!novoAprendizado.trim()} className="self-start">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          <ul className="divide-y divide-gray-100">
            {aprendizados.map((a) => (
              <li key={a.id} className={`flex items-start gap-3 py-2.5 text-sm ${a.ativo ? "" : "opacity-50"}`}>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-violet-600"
                  checked={a.ativo}
                  title={a.ativo ? "Ativo — clique para desativar" : "Desativado"}
                  onChange={(e) => salvarAprendizado(a.id, { ativo: e.target.checked })}
                />
                <span className={`flex-1 text-gray-800 ${a.ativo ? "" : "line-through"}`}>{a.texto}</span>
                <span className="shrink-0 text-xs text-gray-400">{new Date(a.criadoEm).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
            {aprendizados.length === 0 && <li className="py-2 text-sm text-gray-400">Nenhum ainda.</li>}
          </ul>
        </section>
      )}

      {aba === "como-funciona" && <ComoFunciona />}
    </div>
  );
}

function Indicador({
  icon: Icon, cor, valor, rotulo, detalhe,
}: { icon: typeof Inbox; cor: string; valor: string; rotulo: string; detalhe?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <div className="flex items-center gap-2.5">
        <div className={`rounded-lg p-2 ${cor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold leading-tight text-gray-900 tabular-nums">{valor}</div>
          <div className="text-xs text-gray-500">{rotulo}</div>
        </div>
      </div>
      {detalhe && <div className="mt-1.5 text-xs text-gray-400">{detalhe}</div>}
    </div>
  );
}

function Vazio({ icon: Icon, titulo, children }: { icon: typeof Inbox; titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
      <Icon className="mx-auto mb-2 w-8 h-8 text-gray-300" />
      <div className="font-medium text-gray-700">{titulo}</div>
      <div className="mt-1 text-sm text-gray-500">{children}</div>
    </div>
  );
}

// Dia + barra de progresso até a meta de contatos (aprovados + pendentes).
function CabecalhoDia({ mes, dia, pendentes, aprovados }: { mes: string; dia: number; pendentes: number; aprovados: number }) {
  const total = pendentes + aprovados;
  const ok = total >= META_DIA;
  const pct = (v: number) => `${Math.min(100, (v / Math.max(total, META_DIA)) * 100)}%`;
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">{rotuloDia(mes, dia)}</h2>
        <span className={`text-sm font-medium ${ok ? "text-green-700" : "text-amber-700"}`}>
          <Users className="inline w-4 h-4 mr-1 -mt-0.5" />
          {aprovados > 0 && `${num(aprovados)} aprovados + `}
          {num(pendentes)} pendentes {ok ? "· meta batida ✓" : `· meta ${num(META_DIA)}`}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="bg-green-500" style={{ width: pct(aprovados) }} />
        <div className="bg-amber-400" style={{ width: pct(pendentes) }} />
      </div>
    </div>
  );
}

// Faixa do botão "Gerar aprendizado" e do andamento do pedido.
function PainelPedido({
  pedido, reprovadas, ocupado, onGerar,
}: { pedido: Pedido | null; reprovadas: number; ocupado: boolean; onGerar: () => void }) {
  const [agora] = useState(() => Date.now()); // hora de abertura da página (render puro)
  const aberto = pedido?.status === "pendente" || pedido?.status === "andamento";
  if (aberto) {
    return (
      <div className="mb-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
        <div>
          {pedido!.status === "pendente" ? (
            <>
              <b>Pedido enviado às {hora(pedido!.criadoEm)}.</b> O agente começa em até 1 minuto (o computador
              da Laura precisa estar ligado).
            </>
          ) : (
            <>
              <b>O agente está refazendo desde {hora(pedido!.iniciadoEm)}.</b> Costuma levar de 5 a 10 minutos;
              as propostas novas aparecem aqui sozinhas e você recebe a DM.
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <>
      {pedido && pedido.concluidoEm && agora - new Date(pedido.concluidoEm).getTime() < 6 * 3600000 && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm ${
            pedido.status === "erro" ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
          }`}
        >
          {pedido.status === "erro" ? "O último pedido falhou" : "Último pedido concluído"} às {hora(pedido.concluidoEm)}
          {pedido.mensagem ? `: ${pedido.mensagem}` : "."}
        </div>
      )}
      {reprovadas > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex-1 min-w-[240px] text-sm text-red-900">
            Você reprovou <b>{reprovadas}</b> proposta{reprovadas > 1 ? "s" : ""}. Terminou de comentar? Clique para o
            agente transformar os comentários em aprendizado e refazer agora.
          </div>
          <Button onClick={onGerar} disabled={ocupado} className="bg-red-600 hover:bg-red-700 text-white">
            <Sparkles className="w-4 h-4 mr-1" /> Gerar aprendizado
          </Button>
        </div>
      )}
    </>
  );
}

function Detalhes({ p }: { p: Proposta }) {
  // O agente começa o racional pela linha "Combo: ✅…" (critérios que a oferta cumpre): vai em destaque.
  const linhas = (p.racional ?? "").split("\n");
  const combo = linhas[0]?.trim().toLowerCase().startsWith("combo") ? linhas[0].trim() : null;
  const resto = (combo ? linhas.slice(1) : linhas).join("\n").trim();
  return (
    <div className="space-y-3 text-sm">
      {p.acaoExistenteId && !p.acaoApagada && (
        <div className="text-xs rounded-lg bg-blue-50 text-blue-800 px-3 py-2">
          Copy para uma ação que você já planejou: aprovar só preenche o WhatsApp dela.
        </div>
      )}
      {(p.contatos != null || p.empreendimentos) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {p.contatos != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 tabular-nums">
              <Users className="w-3 h-3" /> ~{num(p.contatos)} contatos
            </span>
          )}
          {spots(p.empreendimentos).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800">
              <Building2 className="w-3 h-3" /> {s}
            </span>
          ))}
        </div>
      )}
      {p.base && (
        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-gray-500"><Database className="w-3.5 h-3.5" /> Base e recorte</div>
          <div className="leading-relaxed text-gray-800">{p.base}</div>
        </div>
      )}
      {(combo || resto) && (
        <div className="rounded-xl border border-gray-200 p-3">
          <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-500">
            <Target className="w-3.5 h-3.5" /> Por que esta proposta
          </div>
          {combo && <div className="mb-2 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800">{combo}</div>}
          {resto && <div className="whitespace-pre-wrap leading-relaxed text-gray-700">{resto}</div>}
        </div>
      )}
    </div>
  );
}

function CardReprovada({ p, ocupado, onDesfazer }: { p: Proposta; ocupado: boolean; onDesfazer: () => void }) {
  return (
    <article className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-l-4 border-red-400 bg-red-50/60 px-5 py-3">
        <h3 className="font-semibold text-gray-900 flex-1 min-w-0">{p.titulo}</h3>
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
          <Bot className="w-3 h-3" /> Reprovada · esperando o agente
        </span>
      </div>
      <div className="p-5 space-y-3 text-sm">
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800">
          <div className="text-xs font-semibold mb-1">Seu comentário</div>
          {p.comentario}
        </div>
        <details className="group">
          <summary className="inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
            <ChevronDown className="w-3.5 h-3.5 transition group-open:rotate-180" /> Ver a mensagem reprovada
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 font-sans">{p.whatsapp}</pre>
        </details>
        <Button variant="ghost" size="sm" disabled={ocupado} onClick={onDesfazer}>
          <Undo2 className="w-4 h-4 mr-1" /> Voltar para pendente
        </Button>
      </div>
    </article>
  );
}

// Aprovadas e histórico: uma linha por proposta, mensagem e racional recolhidos.
function ListaCompacta({
  grupos, vazio, selo, renderAcoes, cor,
}: {
  grupos: [string, Proposta[]][];
  vazio: string;
  selo: (p: Proposta) => ReactNode;
  renderAcoes?: (p: Proposta) => ReactNode;
  cor: string;
}) {
  if (grupos.length === 0) return <Vazio icon={Inbox} titulo={vazio}>As propostas aparecem aqui por 30 dias.</Vazio>;
  return (
    <>
      {grupos.map(([k, lista]) => (
        <section key={k} className="mb-8">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900 capitalize">{rotuloDia(lista[0].mes, lista[0].dia)}</h2>
            <span className="text-xs text-gray-500">{num(somaContatos(lista))} contatos</span>
          </div>
          <div className="space-y-2">
            {lista.map((p) => (
              <details key={p.id} className={`group rounded-xl border border-gray-200 border-l-4 ${cor} bg-white shadow-sm`}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                  <ChevronDown className="w-4 h-4 text-gray-400 transition group-open:rotate-180" />
                  <span className="flex-1 min-w-0 font-medium text-gray-900">{p.titulo}</span>
                  {p.contatos != null && <span className="text-xs text-gray-500 tabular-nums">~{num(p.contatos)}</span>}
                  {selo(p)}
                </summary>
                <div className="border-t border-gray-100 p-4 grid lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Detalhes p={p} />
                    {p.comentario && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                        <div className="text-xs font-semibold mb-1">Seu comentário</div>
                        {p.comentario}
                      </div>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm bg-[#dcf8c6]/50 rounded-lg p-3 border border-[#c8e6b0] font-sans">{p.whatsapp}</pre>
                </div>
                {renderAcoes && <div className="flex flex-wrap items-center gap-3 px-4 pb-3">{renderAcoes(p)}</div>}
              </details>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// ── Passo a passo + próximos passos ─────────────────────────────────────────
const PASSOS: { icon: typeof Inbox; titulo: string; quando: string; texto: ReactNode }[] = [
  {
    icon: Bot,
    titulo: "O agente estuda os dados",
    quando: "Seg a sex, 14h",
    texto: (
      <>
        Lê no data lake (Nekt) as levantadas de mão e as reuniões dos últimos 30 dias por base e por SPOT, o histórico
        de 90 dias das campanhas, as cotas que mais vendem e a lista de <b>Aprendizados</b>. Na sexta ele já propõe
        sábado, domingo e segunda.
      </>
    ),
  },
  {
    icon: Inbox,
    titulo: "As propostas chegam aqui",
    quando: "Logo depois da rodada",
    texto: (
      <>
        Cada proposta traz base, quantidade de contatos, SPOT/cota, o <b>porquê</b> (que critérios ela cumpre) e a
        mensagem pronta. A meta é fechar pelo menos {num(META_DIA)} contatos por dia, sem mexer no que você já
        planejou. Você recebe uma DM no Slack com o link.
      </>
    ),
  },
  {
    icon: Check,
    titulo: "Aprovar",
    quando: "Quando a proposta está boa",
    texto: (
      <>
        A ação entra direto no <b>Planejamento Orgânico</b>, na frente &quot;Disparos Marketplace&quot;, com a mensagem
        (do jeito que você editou). Se a proposta completava uma ação sua, ela só preenche o WhatsApp dessa ação. Base e
        RD campanha você completa quando o disparo sai.
      </>
    ),
  },
  {
    icon: X,
    titulo: "Reprovar com comentário",
    quando: "Quando algo não ficou legal",
    texto: (
      <>
        O comentário vira um <b>aprendizado</b>. Com &quot;Reprovar e refazer agora&quot; o agente refaz em 5 a 10
        minutos. Para comentar várias antes, use &quot;Só reprovar&quot; e, no fim, o botão <b>Gerar aprendizado</b>.
        Sem clique, ele refaz sozinho de 30 em 30 minutos, das 14h30 às 19h.
      </>
    ),
  },
  {
    icon: Lightbulb,
    titulo: "O agente aprende",
    quando: "Toda rodada",
    texto: (
      <>
        A aba <b>Aprendizados</b> é a lista de regras que ele segue em todas as escolhas (base, SPOT, tamanho do lote,
        CTA e texto). Você pode escrever uma regra direto ou desmarcar o que não vale mais.
      </>
    ),
  },
  {
    icon: Send,
    titulo: "Disparo",
    quando: "Hoje: manual",
    texto: (
      <>
        No Planejamento Orgânico, o botão <b>Enviar no Slack</b> de cada ação abre a thread no #entrega_disparos com o
        título e a mensagem. Daí em diante, o disparo segue com quem opera o motor.
      </>
    ),
  },
];

const PROXIMOS: { titulo: string; status: string; cor: string; texto: ReactNode; itens?: string[] }[] = [
  {
    titulo: "Aprovou → a mensagem vai no Slack direto para a pessoa responsável",
    status: "Próximo passo",
    cor: "bg-blue-100 text-blue-800",
    texto: (
      <>
        Hoje, entre aprovar aqui e o disparo sair, ainda tem dois cliques manuais (ir ao planejamento e clicar em
        &quot;Enviar no Slack&quot;). A ideia é que o próprio botão <b>Aprovar</b> já entregue a mensagem para quem
        dispara.
      </>
    ),
    itens: [
      "Ao aprovar, o hub manda a proposta no Slack para a pessoa responsável: título, data, base, nº de contatos, SPOT e a mensagem pronta para copiar.",
      "O card da aprovada mostra \"Enviado para <pessoa> às hh:mm\" — e não manda duas vezes se você desfizer e aprovar de novo.",
      "Reaproveita o app do Slack que já existe (disparos_revendas), o mesmo do botão \"Enviar no Slack\".",
      "A definir com você: quem é a responsável (uma pessoa fixa ou por base), se vai por DM ou na thread do #entrega_disparos marcando a pessoa, e se a aprovação envia na hora ou num horário fixo (ex.: todas do dia juntas às 17h).",
    ],
  },
  {
    titulo: "Confirmar que o disparo saiu e preencher o RD campanha",
    status: "Depois",
    cor: "bg-gray-100 text-gray-700",
    texto: (
      <>
        O agente confere no data lake se a campanha aprovada foi de fato disparada e preenche o RD campanha da ação no
        planejamento, fechando o ciclo proposta → aprovação → disparo → resultado.
      </>
    ),
  },
];

function ComoFunciona() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Passo a passo</h2>
        <p className="text-sm text-gray-600 mb-4">Da análise do agente até o disparo sair.</p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PASSOS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.titulo} className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <Icon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{s.titulo}</h3>
                </div>
                <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  <Clock className="w-3 h-3" /> {s.quando}
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{s.texto}</p>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <span className="font-semibold text-gray-700">Resumo do fluxo:</span>
          {["Agente propõe", "Você revisa", "Aprova ou reprova", "Planejamento", "Enviar no Slack", "Disparo"].map((t, i, arr) => (
            <span key={t} className="inline-flex items-center gap-2">
              <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5">{t}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400" />}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-1">
          <Rocket className="w-5 h-5 text-blue-600" /> Próximos passos
        </h2>
        <p className="text-sm text-gray-600 mb-4">O que vem a seguir para tirar trabalho manual do caminho.</p>
        <div className="space-y-3">
          {PROXIMOS.map((p, i) => (
            <div key={p.titulo} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-bold text-gray-400">{i + 1}.</span>
                <h3 className="flex-1 min-w-0 font-semibold text-gray-900">{p.titulo}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.cor}`}>{p.status}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{p.texto}</p>
              {p.itens && (
                <ul className="mt-3 space-y-1.5">
                  {p.itens.map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-gray-700">
                      <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
