"use client";

import { useMemo, useState } from "react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  X,
  Pencil,
  Link as LinkIcon,
  MessageSquare,
  Mail,
  CalendarDays,
  LayoutGrid,
  ListChecks,
  Building2,
  Search,
  AlertTriangle,
} from "lucide-react";

interface LinkItem {
  label?: string;
  url: string;
}
interface Acao {
  id: string;
  frenteId: string;
  mes: string;
  dia: number;
  titulo: string;
  base: string | null;
  empreendimentos: string | null;
  whatsapp: string | null;
  email: string | null;
  rdCampanha: string | null;
  anotacoes: string | null;
  links: LinkItem[];
  feito: boolean;
  ordem: number;
}
interface Frente {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}
interface Props {
  frentesInit: Frente[];
  acoesInit: Array<Omit<Acao, "links"> & { links: unknown }>;
}

const CORES: Record<string, { dot: string; chip: string; tab: string }> = {
  teal: { dot: "bg-teal-500", chip: "bg-teal-50 text-teal-700 border-teal-200", tab: "border-teal-500 bg-teal-50 text-teal-700" },
  indigo: { dot: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700 border-indigo-200", tab: "border-indigo-500 bg-indigo-50 text-indigo-700" },
  pink: { dot: "bg-pink-500", chip: "bg-pink-50 text-pink-700 border-pink-200", tab: "border-pink-500 bg-pink-50 text-pink-700" },
  amber: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200", tab: "border-amber-500 bg-amber-50 text-amber-700" },
  blue: { dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700 border-blue-200", tab: "border-blue-500 bg-blue-50 text-blue-700" },
  green: { dot: "bg-green-500", chip: "bg-green-50 text-green-700 border-green-200", tab: "border-green-500 bg-green-50 text-green-700" },
};
const CORES_KEYS = Object.keys(CORES);
const cor = (c: string) => CORES[c] ?? CORES.teal;

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DOW = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const pad2 = (n: number) => String(n).padStart(2, "0");

function mesLabel(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} de ${y}`;
}
function shiftMes(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
function daysInMonth(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
function firstWeekdayMonday(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const wd = new Date(y, m - 1, 1).getDay(); // 0=Dom
  return (wd + 6) % 7; // 0=Seg
}

export function PlanejamentoClient({ frentesInit, acoesInit }: Props) {
  const [frentes, setFrentes] = useState<Frente[]>(frentesInit);
  const [acoes, setAcoes] = useState<Acao[]>(
    acoesInit.map((a) => ({ ...a, links: Array.isArray(a.links) ? (a.links as LinkItem[]) : [] }))
  );

  const now = new Date();
  const [mesAtivo, setMesAtivo] = useState(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}`);
  const [frenteAtivaId, setFrenteAtivaId] = useState<string | null>(frentesInit[0]?.id ?? null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [view, setView] = useState<"calendario" | "lista">("calendario");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [tip, setTip] = useState<{ text: string; sub?: string; top: number; left: number } | null>(null);

  const hoje = new Date();
  const hojeNum = hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate();
  const acaoDateNum = (mes: string, dia: number) => {
    const [y, m] = mes.split("-").map(Number);
    return y * 10000 + m * 100 + dia;
  };
  const chipState = (a: Acao): "feito" | "alerta" | "pendente" => {
    if (a.feito) return "feito";
    if (acaoDateNum(a.mes, a.dia) < hojeNum) return "alerta";
    return "pendente";
  };

  const frenteAtiva = frentes.find((f) => f.id === frenteAtivaId) ?? frentes[0] ?? null;
  const c = cor(frenteAtiva?.cor ?? "teal");

  const acoesDoMes = useMemo(
    () => acoes.filter((a) => a.mes === mesAtivo && a.frenteId === frenteAtiva?.id),
    [acoes, mesAtivo, frenteAtiva]
  );
  const porDia = useMemo(() => {
    const map = new Map<number, Acao[]>();
    for (const a of acoesDoMes) {
      const arr = map.get(a.dia) ?? [];
      arr.push(a);
      map.set(a.dia, arr);
    }
    return map;
  }, [acoesDoMes]);

  // Busca por mês (em todas as frentes, dentro de todos os campos da ação)
  const buscaResultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return null;
    return acoes
      .filter((a) => a.mes === mesAtivo)
      .filter((a) => {
        const linksStr = (a.links ?? []).map((l) => `${l.label ?? ""} ${l.url}`).join(" ");
        return [a.titulo, a.base, a.empreendimentos, a.whatsapp, a.email, a.rdCampanha, a.anotacoes, linksStr]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q));
      })
      .sort((a, b) => a.dia - b.dia);
  }, [busca, acoes, mesAtivo]);

  // ── Persistência ─────────────────────────────────────────────────────────
  const api = (body: Record<string, unknown>) =>
    fetch("/api/planejamento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const patchLocal = (id: string, patch: Partial<Acao>) =>
    setAcoes((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const persistAcao = async (id: string, patch: Partial<Acao>) => {
    patchLocal(id, patch);
    await api({ action: "update-acao", id, ...patch });
  };

  const salvarAcao = async (a: Acao) => {
    setSavingId(a.id);
    try {
      await api({
        action: "update-acao",
        id: a.id,
        titulo: a.titulo,
        base: a.base,
        empreendimentos: a.empreendimentos,
        whatsapp: a.whatsapp,
        email: a.email,
        rdCampanha: a.rdCampanha,
        anotacoes: a.anotacoes,
        links: a.links,
      });
    } finally {
      setSavingId(null);
    }
  };

  const addAcao = async (dia: number) => {
    if (!frenteAtiva) return;
    const res = await api({ action: "create-acao", frenteId: frenteAtiva.id, mes: mesAtivo, dia, titulo: "" });
    const d = await res.json();
    if (d.acao) {
      setAcoes((prev) => [...prev, { ...d.acao, links: Array.isArray(d.acao.links) ? d.acao.links : [] }]);
      setSelectedDay(dia);
    }
  };

  const deleteAcao = async (id: string) => {
    if (!confirm("Excluir esta ação?")) return;
    await api({ action: "delete-acao", id });
    setAcoes((prev) => prev.filter((a) => a.id !== id));
  };

  const moverData = async (a: Acao, value: string) => {
    if (!value) return;
    const [y, m, d] = value.split("-");
    await persistAcao(a.id, { mes: `${y}-${m}`, dia: Number(d) });
  };

  // links
  const setLinks = (a: Acao, links: LinkItem[]) => patchLocal(a.id, { links });
  const addLink = (a: Acao) => setLinks(a, [...a.links, { label: "", url: "" }]);
  const updateLink = (a: Acao, i: number, patch: Partial<LinkItem>) =>
    setLinks(a, a.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLink = (a: Acao, i: number) => setLinks(a, a.links.filter((_, idx) => idx !== i));

  // ── Frentes ────────────────────────────────────────────────────────────────
  const addFrente = async () => {
    const nome = window.prompt("Nome da nova frente:");
    if (!nome?.trim()) return;
    const novaCor = CORES_KEYS[frentes.length % CORES_KEYS.length];
    const res = await api({ action: "create-frente", nome: nome.trim(), cor: novaCor });
    const d = await res.json();
    if (d.frente) {
      setFrentes((prev) => [...prev, d.frente]);
      setFrenteAtivaId(d.frente.id);
      setSelectedDay(null);
    }
  };
  const renameFrente = async (f: Frente) => {
    const nome = window.prompt("Novo nome da frente:", f.nome);
    if (!nome?.trim() || nome.trim() === f.nome) return;
    await api({ action: "update-frente", id: f.id, nome: nome.trim() });
    setFrentes((prev) => prev.map((x) => (x.id === f.id ? { ...x, nome: nome.trim() } : x)));
  };
  const cycleCor = async (f: Frente) => {
    const idx = CORES_KEYS.indexOf(f.cor);
    const novaCor = CORES_KEYS[(idx + 1) % CORES_KEYS.length];
    await api({ action: "update-frente", id: f.id, cor: novaCor });
    setFrentes((prev) => prev.map((x) => (x.id === f.id ? { ...x, cor: novaCor } : x)));
  };
  const deleteFrente = async (f: Frente) => {
    if (!confirm(`Excluir a frente "${f.nome}" e todas as suas ações? Isso não pode ser desfeito.`)) return;
    await api({ action: "delete-frente", id: f.id });
    setAcoes((prev) => prev.filter((a) => a.frenteId !== f.id));
    setFrentes((prev) => {
      const rest = prev.filter((x) => x.id !== f.id);
      if (frenteAtivaId === f.id) setFrenteAtivaId(rest[0]?.id ?? null);
      return rest;
    });
  };

  const goMes = (delta: number) => {
    setMesAtivo((m) => shiftMes(m, delta));
    setSelectedDay(null);
  };

  // ── Calendário ─────────────────────────────────────────────────────────────
  const cells = useMemo(() => {
    const total = daysInMonth(mesAtivo);
    const lead = firstWeekdayMonday(mesAtivo);
    const arr: (number | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [mesAtivo]);

  const diasComAcao = useMemo(() => Array.from(porDia.keys()).sort((a, b) => a - b), [porDia]);

  // ── Card de ação (editor) ────────────────────────────────────────────────
  const renderAcaoCard = (a: Acao, idx: number) => {
    const atrasada = chipState(a) === "alerta";
    return (
    <div key={a.id} className={`rounded-xl border-2 overflow-hidden ${a.feito ? "border-gray-200 bg-gray-50/60" : atrasada ? "border-red-300 bg-white" : "border-gray-300 bg-white"}`}>
      {/* Cabeçalho da ação (divisão clara) */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${a.feito ? "bg-gray-100 border-gray-200" : atrasada ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
        <button
          onClick={() => persistAcao(a.id, { feito: !a.feito })}
          title={a.feito ? "Marcar como não feito" : "Marcar como feito"}
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
            a.feito ? "bg-green-600 border-green-600 text-white" : "border-gray-300 bg-white hover:border-green-400"
          }`}
        >
          {a.feito && <Check className="w-3.5 h-3.5" />}
        </button>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ação {idx + 1}</span>
        {a.feito ? (
          <span className="text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 flex items-center gap-1">
            <Check className="w-3 h-3" /> feito
          </span>
        ) : atrasada ? (
          <span className="text-[11px] font-medium text-red-700 bg-red-100 border border-red-200 rounded-full px-2 py-0.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> não feito (atrasada)
          </span>
        ) : (
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">a fazer</span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <input
            type="date"
            value={`${a.mes}-${pad2(a.dia)}`}
            onChange={(e) => moverData(a, e.target.value)}
            title="Mudar a data da ação"
            className="text-xs border border-gray-300 rounded-md px-2 py-1"
          />
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 h-8 w-8" onClick={() => deleteAcao(a.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Corpo */}
      <div className="p-4">
      <Input
        value={a.titulo}
        onChange={(e) => patchLocal(a.id, { titulo: e.target.value })}
        placeholder="Título da ação (ex: OPP da Semana — MIA)"
        className={`text-sm font-semibold ${a.feito ? "line-through text-gray-400" : ""}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Base / motivo</label>
          <Textarea value={a.base ?? ""} onChange={(e) => patchLocal(a.id, { base: e.target.value })} rows={2} className="text-sm mt-1" placeholder="Base ou motivo do disparo…" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Building2 className="w-3 h-3" /> Empreendimento(s)</label>
          <Textarea value={a.empreendimentos ?? ""} onChange={(e) => patchLocal(a.id, { empreendimentos: e.target.value })} rows={2} className="text-sm mt-1" placeholder="Empreendimento(s) / oferta…" />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-[11px] font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp</label>
        <Textarea value={a.whatsapp ?? ""} onChange={(e) => patchLocal(a.id, { whatsapp: e.target.value })} rows={2} className="text-sm mt-1" placeholder="Mensagem de WhatsApp ou link…" />
      </div>
      <div className="mt-3">
        <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</label>
        <Textarea value={a.email ?? ""} onChange={(e) => patchLocal(a.id, { email: e.target.value })} rows={2} className="text-sm mt-1" placeholder="Texto de e-mail ou link…" />
      </div>

      {/* Links */}
      <div className="mt-3">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Links</label>
        <div className="space-y-2 mt-1">
          {a.links.map((l, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={l.label ?? ""} onChange={(e) => updateLink(a, i, { label: e.target.value })} placeholder="rótulo (opcional)" className="text-xs w-40 shrink-0" />
              <Input value={l.url} onChange={(e) => updateLink(a, i, { url: e.target.value })} placeholder="https://…" className="text-xs flex-1" />
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 h-8 w-8 shrink-0" onClick={() => removeLink(a, i)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addLink(a)}>
            <Plus className="w-3.5 h-3.5" /> colar link
          </Button>
        </div>
      </div>

      {/* [RD] Campanha — logo acima das anotações */}
      <div className="mt-3">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">[RD] Campanha</label>
        <Input value={a.rdCampanha ?? ""} onChange={(e) => patchLocal(a.id, { rdCampanha: e.target.value })} className="text-sm mt-1" placeholder="Código da campanha no RD Station" />
      </div>

      <div className="mt-3">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Anotações</label>
        <Textarea value={a.anotacoes ?? ""} onChange={(e) => patchLocal(a.id, { anotacoes: e.target.value })} rows={2} className="text-sm mt-1" placeholder="Observações livres…" />
      </div>

      <div className="flex justify-end mt-3">
        <Button size="sm" onClick={() => salvarAcao(a)} disabled={savingId === a.id}>
          <Check className="w-4 h-4" /> {savingId === a.id ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      </div>
    </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Planejamento Orgânico</h1>
        <p className="text-gray-500 text-sm">Organize as ações do mês por frente — disparos, comunidade, social e novas ideias.</p>
      </div>

      {/* Topo: mês + visão */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => goMes(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-bold text-lg capitalize min-w-[170px] text-center">{mesLabel(mesAtivo)}</span>
          <Button variant="outline" size="icon" onClick={() => goMes(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="inline-flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setView("calendario")} className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${view === "calendario" ? "bg-gray-900 text-white" : "bg-white text-gray-600"}`}>
            <LayoutGrid className="w-4 h-4" /> Calendário
          </button>
          <button onClick={() => setView("lista")} className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${view === "lista" ? "bg-gray-900 text-white" : "bg-white text-gray-600"}`}>
            <ListChecks className="w-4 h-4" /> Lista
          </button>
        </div>
      </div>

      {/* Frentes */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {frentes.map((f) => {
          const fc = cor(f.cor);
          const ativa = f.id === frenteAtiva?.id;
          const total = acoes.filter((a) => a.frenteId === f.id && a.mes === mesAtivo).length;
          return (
            <div key={f.id} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold cursor-pointer ${ativa ? `${fc.tab} border-2` : "border-gray-200 bg-white text-gray-600"}`} onClick={() => { setFrenteAtivaId(f.id); setSelectedDay(null); }}>
              <span className={`w-2.5 h-2.5 rounded-full ${fc.dot}`} onClick={(e) => { e.stopPropagation(); if (ativa) cycleCor(f); }} title={ativa ? "Trocar cor" : ""} />
              {f.nome}
              <span className="text-[11px] text-gray-400 font-semibold">{total}</span>
              {ativa && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); renameFrente(f); }} className="text-gray-400 hover:text-gray-700" title="Renomear"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteFrente(f); }} className="text-gray-400 hover:text-red-600" title="Excluir frente"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          );
        })}
        <button onClick={addFrente} className="rounded-full border border-dashed border-gray-300 text-gray-500 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50">+ Nova frente</button>
      </div>

      {/* Busca por mês (em todas as frentes) */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={`Buscar em ${mesLabel(mesAtivo)} — título, base, mensagem, [RD], links…`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 h-10"
        />
        {busca && (
          <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!frenteAtiva ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma frente ainda.</p>
          <p className="text-sm">Crie a primeira frente para começar o planejamento.</p>
        </div>
      ) : buscaResultados ? (
        /* ── Resultados da busca ── */
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {buscaResultados.length} resultado(s) em <span className="capitalize">{mesLabel(mesAtivo)}</span> para “{busca}”
          </p>
          {buscaResultados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nada encontrado neste mês.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {buscaResultados.map((a) => {
                const f = frentes.find((x) => x.id === a.frenteId);
                const fc = cor(f?.cor ?? "teal");
                const st = chipState(a);
                return (
                  <button
                    key={a.id}
                    onClick={() => { setFrenteAtivaId(a.frenteId); setSelectedDay(a.dia); setView("calendario"); setBusca(""); }}
                    className="w-full text-left rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 flex items-start gap-3"
                  >
                    <span className={`w-9 h-9 rounded-lg ${fc.dot} text-white text-sm font-bold grid place-items-center shrink-0`}>{a.dia}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {a.titulo || "(sem título)"}
                        {st === "feito" && <Check className="w-3.5 h-3.5 text-green-600" />}
                        {st === "alerta" && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      </p>
                      <p className="text-[11px] text-gray-400">{f?.nome} · dia {a.dia}</p>
                      {(a.base || a.empreendimentos) && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{a.empreendimentos || a.base}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : view === "calendario" ? (
        <>
          {/* Grade do mês */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-7">
              {DOW.map((d) => (
                <div key={d} className="bg-gray-50 border-b border-gray-200 py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">{d}</div>
              ))}
              {cells.map((day, idx) => {
                const list = day ? porDia.get(day) ?? [] : [];
                const isSel = day !== null && selectedDay === day;
                const temAlerta = list.some((a) => chipState(a) === "alerta");
                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDay(day)}
                    className={`min-h-[92px] border-r border-b border-gray-100 p-1.5 ${day ? "cursor-pointer hover:bg-gray-50/70" : "bg-gray-50/40"} ${
                      isSel ? `${c.chip} ring-2 ring-inset` : temAlerta ? "bg-red-50/60" : ""
                    }`}
                  >
                    {day && (
                      <>
                        <div className="text-xs font-bold text-gray-500 mb-1">{day}</div>
                        {list.slice(0, 3).map((a) => {
                          const st = chipState(a);
                          const cls =
                            st === "feito"
                              ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                              : st === "alerta"
                              ? "bg-red-100 text-red-700 border-red-300"
                              : c.chip;
                          return (
                            <span
                              key={a.id}
                              onMouseEnter={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                const w = typeof window !== "undefined" ? window.innerWidth : 1000;
                                setTip({
                                  text: a.titulo || "(sem título)",
                                  sub: a.empreendimentos || a.base || undefined,
                                  top: r.bottom + 6,
                                  left: Math.max(8, Math.min(r.left, w - 296)),
                                });
                              }}
                              onMouseLeave={() => setTip(null)}
                              className={`block text-[10px] leading-tight px-1.5 py-0.5 rounded mb-1 border truncate font-semibold ${cls}`}
                            >
                              {st === "feito" ? "✓ " : st === "alerta" ? "⚠ " : ""}
                              {a.titulo || "(sem título)"}
                            </span>
                          );
                        })}
                        {list.length > 3 && <span className="text-[10px] text-gray-400 font-semibold">+{list.length - 3}</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editor do dia */}
          {selectedDay !== null && (
            <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
              <div className={`flex items-center justify-between px-4 py-3 border-b ${c.chip}`}>
                <h3 className="font-bold text-sm">Ações de {pad2(selectedDay)}/{mesAtivo.split("-")[1]} · {frenteAtiva.nome}</h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-500 hover:text-gray-800"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-4 bg-gray-50/40">
                {(porDia.get(selectedDay) ?? []).map((a, i) => renderAcaoCard(a, i))}
                <button onClick={() => addAcao(selectedDay)} className={`w-full border border-dashed rounded-lg py-2.5 font-semibold text-sm bg-white ${c.tab}`}>
                  + Adicionar ação em {pad2(selectedDay)}/{mesAtivo.split("-")[1]}
                </button>
              </div>
            </div>
          )}
          {selectedDay === null && (
            <p className="text-center text-sm text-gray-400 mt-4">Clique em um dia do calendário para ver e editar as ações.</p>
          )}
        </>
      ) : (
        /* ── Visão em lista ── */
        <div className="space-y-4">
          {diasComAcao.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma ação em {mesLabel(mesAtivo)} nesta frente.</p>
            </div>
          ) : (
            diasComAcao.map((dia) => (
              <div key={dia}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 rounded-lg ${c.dot} text-white text-xs font-bold grid place-items-center`}>{dia}</span>
                  <span className="text-sm font-semibold text-gray-700">{pad2(dia)}/{mesAtivo.split("-")[1]}</span>
                </div>
                <div className="space-y-4 pl-2">{(porDia.get(dia) ?? []).map((a, i) => renderAcaoCard(a, i))}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tooltip do calendário (lê a linha toda no hover) */}
      {tip && (
        <div
          style={{ position: "fixed", top: tip.top, left: tip.left, maxWidth: 288, zIndex: 50 }}
          className="pointer-events-none rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg"
        >
          <p className="font-semibold leading-snug">{tip.text}</p>
          {tip.sub && <p className="text-gray-300 mt-0.5 leading-snug">{tip.sub}</p>}
        </div>
      )}
    </div>
  );
}
