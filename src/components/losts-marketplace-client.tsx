"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
  AreaChart,
  Area,
} from "recharts";
import { BackButton } from "@/components/back-button";

// ─── Paleta (validada — dataviz) ────────────────────────────────────────────
const PALETTE = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];
const GRAY = "#94a3b8";
const INK = "#0b0b0b";
const MUTED = "#64748b";
const GRID = "#e2e8f0";
const CANAL_COR: Record<string, string> = { "Midia Paga": "#2a78d6", "Base Interna": "#1baf7a", Outros: GRAY };
const corSerie = (nome: string, i: number) => (nome === "Outros" ? GRAY : PALETTE[i % PALETTE.length]);

interface MotivoN { motivo: string; n: number; pct: number }
interface EmpreendAgg { label: string; total: number; motivos: MotivoN[] }
interface EtapaAgg { label: string; ordem: number; total: number; stack: Record<string, number>; full: { motivo: string; n: number }[] }
interface Payload {
  meta: { funil: string; fonte: string; canalRegra: string; grao: string; snapshotAt?: string };
  source: "nekt" | "snapshot";
  lastSync: string | null;
  minDate: string;
  maxDate: string;
  from: string;
  to: string;
  total: number;
  trend: { mes: string; n: number }[];
  motivos: MotivoN[];
  canais: { canal: string; n: number; pct: number }[];
  empreendimentos: EmpreendAgg[];
  etapas: EtapaAgg[];
  motivosEtapa: string[];
}

// status do sync (1x/dia): verde ok / amarelo atrasado / cinza snapshot
function statusSync(p: Payload): { cor: string; bg: string; txt: string } {
  if (p.source === "nekt" && p.lastSync) {
    const dt = new Date(p.lastSync);
    const ageH = (Date.now() - dt.getTime()) / 3.6e6;
    const quando = dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    if (ageH <= 30) return { cor: "#059669", bg: "#ecfdf5", txt: `Dados atualizados · última sincronização ${quando}` };
    return { cor: "#b45309", bg: "#fffbeb", txt: `Sync atrasado — última sincronização ${quando} (há ~${Math.round(ageH)}h). Pode ter falhado.` };
  }
  const q = p.meta.snapshotAt ? ` de ${p.meta.snapshotAt.split("-").reverse().join("/")}` : "";
  return { cor: "#64748b", bg: "#f1f5f9", txt: `Snapshot fixo${q} — sync automático ainda não ativo.` };
}

const MES3 = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESFULL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const nf = new Intl.NumberFormat("pt-BR");
const fmtMes = (m: string) => { const [a, mm] = m.split("-"); return `${MES3[+mm - 1]}/${a.slice(2)}`; };
const fmtMesFull = (m: string) => { const [a, mm] = m.split("-"); return `${MESFULL[+mm - 1]}/${a}`; };
const fmtData = (iso: string) => { const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; };
const cut = (s: string, n = 26) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// intervalo dos "últimos N meses" terminando em maxDate
function ultimosMeses(maxDate: string, n: number, minDate: string) {
  const [ay, am] = maxDate.split("-").map(Number);
  const d = new Date(Date.UTC(ay, am - 1 - (n - 1), 1));
  const from = d.toISOString().slice(0, 10);
  return { from: from < minDate ? minDate : from, to: maxDate };
}

function ChartCard({ titulo, subtitulo, altura, children }: { titulo: string; subtitulo?: string; altura: number; children: React.ReactElement }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{titulo}</div>
      {subtitulo && <div className="mb-3 mt-0.5 text-xs text-slate-500">{subtitulo}</div>}
      <div style={{ width: "100%", height: altura }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

// Tooltip compartilhado. Se a linha carregar `__full` (lista completa de motivos),
// mostra TODOS os motivos daquela etapa — sem agrupar em "Outros".
function TT({ active, payload, label, showPct = true }: any) {
  if (!active || !payload?.length) return null;
  const full = payload[0]?.payload?.__full as { motivo: string; n: number }[] | undefined;
  type TItem = { name: string; value: number; color?: string };
  const items: TItem[] = full
    ? full.map((f) => ({ name: f.motivo, value: f.n }))
    : payload.filter((p: any) => p.value).map((p: any) => ({ name: p.name, value: p.value, color: p.color || p.fill }));
  const vis = items.filter((i) => i.value).sort((a, b) => b.value - a.value);
  const soma = vis.reduce((s, i) => s + i.value, 0);
  return (
    <div className="max-w-xs rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-md">
      {label != null && (
        <div className="mb-1 font-semibold text-slate-900">
          {label}
          {full && <span className="ml-1 font-normal text-slate-400">· {nf.format(soma)} no total</span>}
        </div>
      )}
      {vis.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 flex-none rounded-sm" style={{ background: p.color || "#94a3b8" }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-medium tabular-nums text-slate-900">{nf.format(p.value)}</span>
          {showPct && soma > 1 && vis.length > 1 && (
            <span className="tabular-nums text-slate-400">({((p.value / soma) * 100).toFixed(0)}%)</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function LostsMarketplaceClient() {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (f?: string, t?: string) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (f) qs.set("from", f);
    if (t) qs.set("to", t);
    const res = await fetch(`/api/losts-marketplace?${qs.toString()}`);
    const json: Payload = await res.json();
    setData(json); setMin(json.minDate); setMax(json.maxDate); setFrom(json.from); setTo(json.to);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const preset = (n: number | "all") => {
    if (!max) return;
    const r = n === "all" ? { from: min, to: max } : ultimosMeses(max, n, min);
    setFrom(r.from); setTo(r.to); carregar(r.from, r.to);
  };
  const presetAtivo = (n: number | "all") => {
    if (!max) return false;
    const r = n === "all" ? { from: min, to: max } : ultimosMeses(max, n, min);
    return from === r.from && to === r.to;
  };

  const presets: { label: string; v: number | "all" }[] = [
    { label: "3 meses", v: 3 }, { label: "6 meses", v: 6 }, { label: "12 meses", v: 12 }, { label: "Tudo", v: "all" },
  ];

  const mesesNoPeriodo = data ? data.trend.length || 1 : 1;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6">
      <BackButton />
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-slate-900">Losts — Marketplace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Motivos de perda do funil de Marketplace (Pipedrive · pipeline 37), por <strong>data da perda</strong>. Fonte: Nekt.
        </p>
      </div>

      {/* Filtro: presets de meses + intervalo de datas exatas */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Período</span>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => preset(p.v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              presetAtivo(p.v) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          De
          <input type="date" value={from} min={min} max={to || max}
            onChange={(e) => { setFrom(e.target.value); carregar(e.target.value, to); }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          até
          <input type="date" value={to} min={from || min} max={max}
            onChange={(e) => { setTo(e.target.value); carregar(from, e.target.value); }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800" />
        </label>
        {loading && <span className="text-xs text-slate-400">carregando…</span>}
      </div>

      {data && (
        <>
          {/* status do sync / última atualização */}
          {(() => {
            const s = statusSync(data);
            return (
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ color: s.cor, background: s.bg }}>
                <span className="h-2 w-2 rounded-full" style={{ background: s.cor }} />
                {s.txt}
              </div>
            );
          })()}

          {/* Hero + tendência */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Contatos perdidos no período</div>
              <div className="mt-2 text-4xl font-bold tabular-nums text-slate-900">{nf.format(data.total)}</div>
              <div className="mt-1 text-xs text-slate-500">
                {fmtData(data.from)} – {fmtData(data.to)} · média {nf.format(Math.round(data.total / mesesNoPeriodo))}/mês
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Perdas por mês</div>
              <div style={{ width: "100%", height: 132 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2a78d6" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis tick={{ fontSize: 10, fill: MUTED }} width={36} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<TT showPct={false} />} labelFormatter={(l: unknown) => fmtMesFull(String(l))} />
                    <Area type="monotone" dataKey="n" name="Perdas" stroke="#2a78d6" strokeWidth={2} fill="url(#gTrend)" dot={{ r: 2.5, fill: "#2a78d6" }}>
                      <LabelList dataKey="n" position="top" formatter={(v: unknown) => nf.format(Number(v))} style={{ fontSize: 10, fill: MUTED }} />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 1 — Motivos */}
            <ChartCard titulo="1 · Motivos de perda" subtitulo={`% dos ${nf.format(data.total)} contatos perdidos (top 10)`} altura={Math.max(300, Math.min(data.motivos.length, 10) * 32)}>
              <BarChart data={data.motivos.slice(0, 10).map((m) => ({ ...m, motivoCurto: cut(m.motivo, 30) }))} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="motivoCurto" width={200} tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT showPct={false} />} />
                <Bar dataKey="n" name="Perdas" fill="#2a78d6" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="pct" position="right" formatter={(v: unknown) => `${Number(v).toFixed(1)}%`} style={{ fontSize: 11, fill: MUTED }} />
                </Bar>
              </BarChart>
            </ChartCard>

            {/* 3 — Canal */}
            <ChartCard titulo="3 · Perda por canal" subtitulo="Mídia Paga (rd contém “pag”) · Base Interna (“campaign”) · Outros" altura={Math.max(300, data.canais.length * 70 + 30)}>
              <BarChart data={data.canais} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }} barCategoryGap={18}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="canal" width={110} tick={{ fontSize: 12, fill: INK }} axisLine={false} tickLine={false} tickFormatter={(c: string) => (c === "Midia Paga" ? "Mídia Paga" : c)} />
                <Tooltip content={<TT showPct={false} />} />
                <Bar dataKey="n" name="Perdas" radius={[0, 4, 4, 0]}>
                  {data.canais.map((c) => <Cell key={c.canal} fill={CANAL_COR[c.canal] ?? GRAY} />)}
                  <LabelList dataKey="pct" position="right" formatter={(v: unknown) => `${Number(v).toFixed(1)}%`} style={{ fontSize: 11, fill: MUTED }} />
                </Bar>
              </BarChart>
            </ChartCard>

            {/* 2 — Motivo por empreendimento (TODOS os empreendimentos, 5 motivos de cada) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">2 · Motivo por empreendimento</div>
              <div className="mb-3 mt-0.5 text-xs text-slate-500">
                Todos os {data.empreendimentos.length} empreendimentos · 5 motivos de maior volume de cada
              </div>
              <div className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
                {data.empreendimentos.map((e) => {
                  const maxM = e.motivos[0]?.n || 1;
                  return (
                    <div key={e.label} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-slate-800" title={e.label}>{e.label}</span>
                        <span className="flex-none text-[11px] tabular-nums text-slate-400">{nf.format(e.total)} perdas</span>
                      </div>
                      <div className="space-y-1.5">
                        {e.motivos.map((m) => (
                          <div key={m.motivo} className="grid grid-cols-[130px_1fr_auto] items-center gap-2">
                            <span className="truncate text-[11px] text-slate-600" title={m.motivo}>{cut(m.motivo, 22)}</span>
                            <div className="h-2.5 overflow-hidden rounded bg-slate-200/70">
                              <div className="h-full rounded bg-blue-500" style={{ width: `${(m.n / maxM) * 100}%` }} />
                            </div>
                            <span className="min-w-[62px] text-right text-[11px] tabular-nums text-slate-500">{nf.format(m.n)} · {m.pct.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4 — Motivo por etapa (empilhado; tooltip lista TODOS os motivos, sem "Outros") */}
            <ChartCard titulo="4 · Motivo de perda por etapa" subtitulo="Quantidade e motivo de lost em cada etapa — passe o mouse para ver a lista completa de motivos" altura={Math.max(380, data.etapas.length * 32 + 40)}>
              <BarChart
                data={data.etapas.map((e) => ({ label: e.label, __full: e.full, ...e.stack }))}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                barCategoryGap={6}
              >
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT showPct />} cursor={{ fill: "rgba(148,163,184,.12)" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {data.motivosEtapa.map((m, i) => (
                  <Bar key={m} dataKey={m} name={cut(m, 22)} stackId="e" fill={corSerie(m, i)} />
                ))}
              </BarChart>
            </ChartCard>
          </div>

          <p className="mt-6 text-xs text-slate-400">{data.meta.fonte} · grão: {data.meta.grao}. Canal: {data.meta.canalRegra}.</p>
        </>
      )}
    </div>
  );
}
