"use client";

import { useMemo, useState } from "react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Undo2, Lightbulb, Users, Building2, Plus } from "lucide-react";

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
  status: "pendente" | "aprovada" | "reprovada" | "substituida";
  comentario: string | null;
  substituiId: string | null;
  acaoExistenteId: string | null;
  acaoId: string | null;
}
interface Aprendizado {
  id: string;
  texto: string;
  ativo: boolean;
  criadoEm: string;
}

const STATUS: Record<Proposta["status"], { label: string; cls: string }> = {
  pendente: { label: "Aguardando seu OK", cls: "bg-amber-100 text-amber-800" },
  aprovada: { label: "Aprovada · no planejamento", cls: "bg-green-100 text-green-800" },
  reprovada: { label: "Reprovada · o agente vai propor outra", cls: "bg-red-100 text-red-800" },
  substituida: { label: "Substituída", cls: "bg-gray-100 text-gray-500" },
};

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
function rotuloDia(mes: string, dia: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1, dia);
  return `${DIAS_SEMANA[d.getDay()]}, ${String(dia).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
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

export function PropostasClient({
  propostasInit,
  aprendizadosInit,
}: {
  propostasInit: Proposta[];
  aprendizadosInit: Aprendizado[];
}) {
  const [propostas, setPropostas] = useState(propostasInit);
  const [aprendizados, setAprendizados] = useState(aprendizadosInit);
  const [copias, setCopias] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [reprovando, setReprovando] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [novoAprendizado, setNovoAprendizado] = useState("");
  const [mostrarSubstituidas, setMostrarSubstituidas] = useState(false);

  const porDia = useMemo(() => {
    const g = new Map<string, Proposta[]>();
    for (const p of propostas) {
      if (p.status === "substituida" && !mostrarSubstituidas) continue;
      const k = `${p.mes}-${String(p.dia).padStart(2, "0")}`;
      g.set(k, [...(g.get(k) ?? []), p]);
    }
    return [...g.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [propostas, mostrarSubstituidas]);

  const troca = (p: Proposta) => setPropostas((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...p } : x)));

  async function agir(id: string, body: Record<string, unknown>) {
    setSalvando(id);
    setErro(null);
    try {
      const j = await api({ id, ...body });
      troca(j.proposta);
      if (body.action === "reprovar") {
        setReprovando(null);
        setAprendizados((a) => [
          { id: `tmp-${id}`, texto: `${j.proposta.titulo} → ${body.comentario}`, ativo: true, criadoEm: new Date().toISOString() },
          ...a,
        ]);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(null);
    }
  }

  async function salvarAprendizado(id: string, patch: Partial<Aprendizado>) {
    if (id.startsWith("tmp-")) return; // recarregue a página para editar um recém-criado
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <BackButton />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Propostas de disparo · Marketplace</h1>
        <p className="text-sm text-gray-600">
          O agente propõe todo dia às 14h os disparos do dia seguinte. <b>Aprovar</b> coloca a ação
          direto no planejamento (o RD campanha continua com você). <b>Reprovar</b> pede um comentário:
          ele vira aprendizado e o agente propõe outra mensagem no lugar.
        </p>
      </div>

      {erro && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{erro}</div>}

      {porDia.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">
          Nenhuma proposta por enquanto. A próxima rodada sai às 14h.
        </div>
      )}

      {porDia.map(([k, lista]) => {
        const total = lista
          .filter((p) => p.status === "pendente" || p.status === "aprovada")
          .reduce((s, p) => s + (p.contatos ?? 0), 0);
        return (
          <section key={k} className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">{rotuloDia(lista[0].mes, lista[0].dia)}</h2>
              <span className={`text-sm font-medium ${total >= 4000 ? "text-green-700" : "text-amber-700"}`}>
                <Users className="inline w-4 h-4 mr-1" />
                {total.toLocaleString("pt-BR")} contatos propostos {total >= 4000 ? "✓" : "· meta 4.000"}
              </span>
            </div>
            <div className="space-y-4">
              {lista.map((p) => {
                const st = STATUS[p.status];
                const editavel = p.status === "pendente";
                return (
                  <div key={p.id} className="rounded-xl border-2 border-gray-300 bg-white overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <span className="font-semibold text-gray-900 flex-1 min-w-0">{p.titulo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        {p.acaoExistenteId && (
                          <div className="text-xs rounded bg-blue-50 text-blue-800 px-2 py-1">
                            Copy para uma ação que você já planejou: aprovar só preenche o WhatsApp dela.
                          </div>
                        )}
                        {p.base && (
                          <div><span className="text-gray-500">Base:</span> {p.base}</div>
                        )}
                        {p.contatos != null && (
                          <div><span className="text-gray-500">Contatos:</span> ~{p.contatos.toLocaleString("pt-BR")}</div>
                        )}
                        {p.empreendimentos && (
                          <div><Building2 className="inline w-4 h-4 mr-1 text-gray-400" />{p.empreendimentos}</div>
                        )}
                        {p.racional && (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 whitespace-pre-wrap text-gray-700">
                            <div className="text-xs font-semibold text-gray-500 mb-1">Por que esta proposta</div>
                            {p.racional}
                          </div>
                        )}
                        {p.comentario && (
                          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800">
                            <div className="text-xs font-semibold mb-1">Seu comentário</div>
                            {p.comentario}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          Mensagem {editavel && "(pode ajustar antes de aprovar)"}
                        </div>
                        {editavel ? (
                          <Textarea
                            className="min-h-[260px] text-sm"
                            value={copias[p.id] ?? p.whatsapp}
                            onChange={(e) => setCopias((c) => ({ ...c, [p.id]: e.target.value }))}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 font-sans">
                            {p.whatsapp}
                          </pre>
                        )}
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      {editavel && reprovando !== p.id && (
                        <div className="flex gap-2">
                          <Button
                            disabled={salvando === p.id}
                            onClick={() => agir(p.id, { action: "aprovar", whatsapp: copias[p.id] })}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                          <Button variant="outline" disabled={salvando === p.id} onClick={() => setReprovando(p.id)}>
                            <X className="w-4 h-4 mr-1" /> Reprovar / pedir ajuste
                          </Button>
                        </div>
                      )}
                      {reprovando === p.id && (
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
                              Reprovar e salvar aprendizado
                            </Button>
                            <Button variant="outline" onClick={() => setReprovando(null)}>Cancelar</Button>
                          </div>
                        </div>
                      )}
                      {(p.status === "aprovada" || p.status === "reprovada") && (
                        <Button variant="ghost" size="sm" disabled={salvando === p.id} onClick={() => agir(p.id, { action: "desfazer" })}>
                          <Undo2 className="w-4 h-4 mr-1" /> Voltar para pendente
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <label className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <input type="checkbox" checked={mostrarSubstituidas} onChange={(e) => setMostrarSubstituidas(e.target.checked)} />
        Mostrar propostas substituídas
      </label>

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
    </div>
  );
}
