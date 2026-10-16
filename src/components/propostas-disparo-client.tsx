"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, Undo2, Lightbulb, Users, Building2, Plus, Sparkles, Loader2, AlertTriangle, Trash2, ExternalLink,
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

type Aba = "decidir" | "aprovadas" | "historico" | "aprendizados";

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
function rotuloDia(mes: string, dia: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1, dia);
  return `${DIAS_SEMANA[d.getDay()]}, ${String(dia).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}
const chaveDia = (p: Proposta) => `${p.mes}-${String(p.dia).padStart(2, "0")}`;
const hora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

function agrupar(lista: Proposta[], desc = false) {
  const g = new Map<string, Proposta[]>();
  for (const p of lista) g.set(chaveDia(p), [...(g.get(chaveDia(p)) ?? []), p]);
  return [...g.entries()].sort(([a], [b]) => (desc ? b.localeCompare(a) : a.localeCompare(b)));
}

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

  const ABAS: { id: Aba; label: string; n: number }[] = [
    { id: "decidir", label: "Para decidir", n: decidir.length },
    { id: "aprovadas", label: "Aprovadas", n: aprovadas.length },
    { id: "historico", label: "Histórico", n: historico.length },
    { id: "aprendizados", label: "Aprendizados", n: ativos },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <BackButton />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Propostas de disparo · Marketplace</h1>
        <p className="text-sm text-gray-600">
          O agente propõe todo dia às 14h os disparos do dia seguinte. <b>Aprovar</b> coloca a ação
          direto no planejamento e move a proposta para a aba Aprovadas. <b>Reprovar</b> pede um comentário,
          que vira aprendizado; depois clique em <b>Gerar aprendizado</b> e o agente refaz na hora.
        </p>
      </div>

      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              aba === a.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {a.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 text-xs ${
                a.id === "decidir" && a.n > 0 ? "bg-amber-200 text-amber-900" : "bg-gray-200 text-gray-600"
              }`}
            >
              {a.n}
            </span>
          </button>
        ))}
      </div>

      {erro && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{erro}</div>}

      {aba === "decidir" && (
        <>
          <PainelPedido
            pedido={pedido}
            reprovadas={reprovadas.length}
            ocupado={salvando === "pedido"}
            onGerar={gerarAprendizado}
          />

          {decidir.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">
              Nada para decidir agora. A próxima rodada sai às 14h.
            </div>
          )}

          {agrupar(decidir).map(([k, lista]) => {
            const pendentes = lista.filter((p) => p.status === "pendente").reduce((s, p) => s + (p.contatos ?? 0), 0);
            const jaAprovados = aprovadas.filter((p) => chaveDia(p) === k).reduce((s, p) => s + (p.contatos ?? 0), 0);
            const total = pendentes + jaAprovados;
            return (
              <section key={k} className="mb-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">{rotuloDia(lista[0].mes, lista[0].dia)}</h2>
                  <span className={`text-sm font-medium ${total >= 4000 ? "text-green-700" : "text-amber-700"}`}>
                    <Users className="inline w-4 h-4 mr-1" />
                    {jaAprovados > 0 && `${jaAprovados.toLocaleString("pt-BR")} aprovados + `}
                    {pendentes.toLocaleString("pt-BR")} pendentes {total >= 4000 ? "✓" : "· meta 4.000"}
                  </span>
                </div>
                <div className="space-y-4">
                  {lista.map((p) =>
                    p.status === "reprovada" ? (
                      <CardReprovada key={p.id} p={p} ocupado={salvando === p.id} onDesfazer={() => agir(p.id, { action: "desfazer" })} />
                    ) : (
                      <div key={p.id} className="rounded-xl border-2 border-gray-300 bg-white overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <span className="font-semibold text-gray-900 flex-1 min-w-0">{p.titulo}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Aguardando seu OK</span>
                        </div>
                        {p.acaoApagada && (
                          <div className="mx-4 mt-3 flex gap-2 rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm text-amber-900">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                              Esta proposta completava uma ação que você <b>apagou do planejamento</b>. Se aprovar,
                              ela vira uma ação nova nesse dia (com este título). Se o dia já está do jeito que você
                              quer, descarte.
                            </span>
                          </div>
                        )}
                        <div className="p-4 grid md:grid-cols-2 gap-4">
                          <Detalhes p={p} />
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Mensagem (pode ajustar antes de aprovar)</div>
                            <Textarea
                              className="min-h-[260px] text-sm"
                              value={copias[p.id] ?? p.whatsapp}
                              onChange={(e) => setCopias((c) => ({ ...c, [p.id]: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          {reprovando !== p.id ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                disabled={salvando === p.id}
                                onClick={() => agir(p.id, { action: "aprovar", whatsapp: copias[p.id] })}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" /> {p.acaoApagada ? "Aprovar como ação nova" : "Aprovar"}
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
                              <Textarea
                                autoFocus
                                placeholder="O que não ficou legal? Ex.: troque o SPOT, Urubici não converte em lost com opp · para hóspede de SP ofereça SPOT pronto · tom muito formal · não citar 3 cotas"
                                value={comentarios[p.id] ?? ""}
                                onChange={(e) => setComentarios((c) => ({ ...c, [p.id]: e.target.value }))}
                              />
                              <div className="flex gap-2">
                                <Button
                                  disabled={salvando === p.id || !(comentarios[p.id] ?? "").trim()}
                                  onClick={() => agir(p.id, { action: "reprovar", comentario: comentarios[p.id] })}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Reprovar e salvar comentário
                                </Button>
                                <Button variant="outline" onClick={() => setReprovando(null)}>Cancelar</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
          selo={() => <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">No planejamento</span>}
        />
      )}

      {aba === "historico" && (
        <ListaCompacta
          grupos={agrupar(historico, true)}
          vazio="Nada no histórico dos últimos 30 dias."
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
        <section className="rounded-xl border-2 border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            <Lightbulb className="inline w-5 h-5 mr-1 text-amber-500" /> Aprendizados do agente
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            O agente lê esta lista antes de criar qualquer proposta e segue cada regra em todas as
            escolhas: base, recorte, SPOT/cota, tamanho do lote, CTA e texto. Desmarque o que não vale mais.
          </p>
          <div className="flex gap-2 mb-4">
            <Textarea
              placeholder="Escrever uma regra direto (ex.: hóspede de SP: citar distância do aeroporto)"
              value={novoAprendizado}
              onChange={(e) => setNovoAprendizado(e.target.value)}
              className="min-h-[44px]"
            />
            <Button onClick={criarAprendizado} disabled={!novoAprendizado.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <ul className="space-y-2">
            {aprendizados.map((a) => (
              <li key={a.id} className={`flex items-start gap-2 text-sm ${a.ativo ? "" : "opacity-50 line-through"}`}>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={a.ativo}
                  title={a.ativo ? "Ativo — clique para desativar" : "Desativado"}
                  onChange={(e) => salvarAprendizado(a.id, { ativo: e.target.checked })}
                />
                <span className="flex-1">{a.texto}</span>
                <span className="text-xs text-gray-400">{new Date(a.criadoEm).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
            {aprendizados.length === 0 && <li className="text-sm text-gray-400">Nenhum ainda.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}

// Faixa do botão "Gerar aprendizado" e do andamento do pedido.
function PainelPedido({
  pedido, reprovadas, ocupado, onGerar,
}: { pedido: Pedido | null; reprovadas: number; ocupado: boolean; onGerar: () => void }) {
  const aberto = pedido?.status === "pendente" || pedido?.status === "andamento";
  if (aberto) {
    return (
      <div className="mb-6 flex gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
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
      {pedido && pedido.concluidoEm && Date.now() - new Date(pedido.concluidoEm).getTime() < 6 * 3600000 && (
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
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
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
  return (
    <div className="space-y-2 text-sm">
      {p.acaoExistenteId && !p.acaoApagada && (
        <div className="text-xs rounded bg-blue-50 text-blue-800 px-2 py-1">
          Copy para uma ação que você já planejou: aprovar só preenche o WhatsApp dela.
        </div>
      )}
      {p.base && <div><span className="text-gray-500">Base:</span> {p.base}</div>}
      {p.contatos != null && <div><span className="text-gray-500">Contatos:</span> ~{p.contatos.toLocaleString("pt-BR")}</div>}
      {p.empreendimentos && <div><Building2 className="inline w-4 h-4 mr-1 text-gray-400" />{p.empreendimentos}</div>}
      {p.racional && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 whitespace-pre-wrap text-gray-700">
          <div className="text-xs font-semibold text-gray-500 mb-1">Por que esta proposta</div>
          {p.racional}
        </div>
      )}
    </div>
  );
}

function CardReprovada({ p, ocupado, onDesfazer }: { p: Proposta; ocupado: boolean; onDesfazer: () => void }) {
  return (
    <div className="rounded-xl border-2 border-red-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200">
        <span className="font-semibold text-gray-900 flex-1 min-w-0">{p.titulo}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Reprovada · esperando o agente</span>
      </div>
      <div className="p-4 space-y-2 text-sm">
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800">
          <div className="text-xs font-semibold mb-1">Seu comentário</div>
          {p.comentario}
        </div>
        <details>
          <summary className="cursor-pointer text-xs text-gray-500">Ver a mensagem reprovada</summary>
          <pre className="mt-2 whitespace-pre-wrap text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 font-sans">{p.whatsapp}</pre>
        </details>
        <Button variant="ghost" size="sm" disabled={ocupado} onClick={onDesfazer}>
          <Undo2 className="w-4 h-4 mr-1" /> Voltar para pendente
        </Button>
      </div>
    </div>
  );
}

// Aprovadas e histórico: uma linha por proposta, mensagem e racional recolhidos.
function ListaCompacta({
  grupos, vazio, selo, renderAcoes,
}: {
  grupos: [string, Proposta[]][];
  vazio: string;
  selo: (p: Proposta) => ReactNode;
  renderAcoes?: (p: Proposta) => ReactNode;
}) {
  if (grupos.length === 0)
    return <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">{vazio}</div>;
  return (
    <>
      {grupos.map(([k, lista]) => (
        <section key={k} className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900">{rotuloDia(lista[0].mes, lista[0].dia)}</h2>
            <span className="text-xs text-gray-500">
              {lista.reduce((s, p) => s + (p.contatos ?? 0), 0).toLocaleString("pt-BR")} contatos
            </span>
          </div>
          <div className="space-y-2">
            {lista.map((p) => (
              <details key={p.id} className="rounded-lg border border-gray-200 bg-white">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <span className="flex-1 min-w-0 font-medium text-gray-900">{p.titulo}</span>
                  {p.contatos != null && <span className="text-xs text-gray-500">~{p.contatos.toLocaleString("pt-BR")}</span>}
                  {selo(p)}
                </summary>
                <div className="border-t border-gray-100 p-3 grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Detalhes p={p} />
                    {p.comentario && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                        <div className="text-xs font-semibold mb-1">Seu comentário</div>
                        {p.comentario}
                      </div>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 font-sans">{p.whatsapp}</pre>
                </div>
                {renderAcoes && <div className="flex flex-wrap items-center gap-3 px-3 pb-3">{renderAcoes(p)}</div>}
              </details>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
