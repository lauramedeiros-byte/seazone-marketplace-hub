"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
const PALETTE = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];
const GRAY = "#94a3b8"; // "Outros"
const INK = "#0b0b0b";
const MUTED = "#64748b";
const GRID = "#e2e8f0";
const CANAL_COR: Record<string, string> = {
  "Midia Paga": "#2a78d6",
  "Base Interna": "#1baf7a",
  Outros: GRAY,
};

const corSerie = (nome: string, i: number) =>
  nome === "Outros" ? GRAY : PALETTE[i % PALETTE.length];

// ─── Tipos do payload da API ────────────────────────────────────────────────
interface StackRow {
  label: string;
  ordem: number;
  total: number;
  [serie: string]: number | string;
}
interface Payload {
  meta: { funil: string; fonte: string; canalRegra: string; criterioData: string; obs: string };
  mesesDisponiveis: string[];
  from: string;
  to: string;
  total: number;
  trend: { mes: string; n: number }[];
  motivos: { motivo: string; n: number; pct: number }[];
  canais: { canal: string; n: number; pct: number }[];
  empreendimentos: StackRow[];
  motivosTop3: string[];
  etapas: StackRow[];
  motivosEtapa: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const MES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function fmtMes(mes: string) {
  const [a, m] = mes.split("-");
  return `${MES_ABREV[Number(m) - 1]}/${a.slice(2)}`;
}
function encurta(s: string, max = 26) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
const nf = new Intl.NumberFormat("pt-BR");

// ─── Card de gráfico ────────────────────────────────────────────────────────
function ChartCard({
  titulo,
  subtitulo,
  altura,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  altura: number;
  children: React.ReactElement;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 text-sm font-semibold text-slate-900">{titulo}</div>
      {subtitulo && <div className="mb-3 text-xs text-slate-500">{subtitulo}</div>}
      <div style={{ width: "100%", height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Tooltip padrão com formatação pt-BR
function TT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-md">
      {label != null && <div className="mb-1 font-semibold text-slate-900">{label}</div>}
      {payload
        .filter((p: any) => p.value)
        .map((p: any) => (
          <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color || p.fill }} />
            <span className="text-slate-600">{p.name}:</span>
            <span className="font-medium tabular-nums text-slate-900">{nf.format(p.value)}</span>
          </div>
        ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export function LostsMarketplaceClient() {
  const [meses, setMeses] = useState<string[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (f?: string, t?: string) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (f) qs.set("from", f);
    if (t) qs.set("to", t);
    const res = await fetch(`/api/losts-marketplace?${qs.toString()}`);
    const json: Payload = await res.json();
    setData(json);
    setMeses(json.mesesDisponiveis);
    setFrom(json.from);
    setTo(json.to);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aplicarPreset = (nMeses: number | "tudo" | "2025") => {
    if (!meses.length) return;
    const ultimo = meses[meses.length - 1];
    let novoFrom: string;
    if (nMeses === "tudo") novoFrom = meses[0];
    else if (nMeses === "2025") novoFrom = "2025-01";
    else novoFrom = meses[Math.max(0, meses.length - nMeses)];
    setFrom(novoFrom);
    setTo(ultimo);
    carregar(novoFrom, ultimo);
  };

  const presets: { label: string; v: number | "tudo" | "2025" }[] = [
    { label: "Últimos 3 meses", v: 3 },
    { label: "Últimos 6 meses", v: 6 },
    { label: "Últimos 12 meses", v: 12 },
    { label: "Todo o período", v: "tudo" },
  ];

  // dados derivados para os gráficos
  const motivosChart = useMemo(() => {
    if (!data) return [];
    const top = data.motivos.slice(0, 10);
    const resto = data.motivos.slice(10).reduce((s, m) => s + m.n, 0);
    const totalOutros = data.motivos.filter((m) => m.motivo === "Outros").reduce((s, m) => s + m.n, 0);
    const arr = top.map((m) => ({ ...m, motivoCurto: encurta(m.motivo) }));
    if (resto - totalOutros > 0 && !top.some((m) => m.motivo === "Outros")) {
      // resto já pode conter "Outros"; deixamos como está para não duplicar
    }
    return arr;
  }, [data]);

  const mesesMedia = data ? data.trend.length || 1 : 1;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6">
      <BackButton />

      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-slate-900">Losts — Marketplace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Motivos de perda do funil de Marketplace (Pipedrive · pipeline 37), por período de{" "}
          <strong>data da perda</strong>. Fonte: Nekt.
        </p>
      </div>

      {/* Filtro de período */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Período
        </span>
        {presets.map((p) => {
          const ativo =
            (p.v === "tudo" && from === meses[0]) ||
            (typeof p.v === "number" && from === meses[Math.max(0, meses.length - p.v)] && to === meses[meses.length - 1]);
          return (
            <button
              key={p.label}
              onClick={() => aplicarPreset(p.v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                ativo
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <label className="flex items-center gap-1 text-xs text-slate-500">
          De
          <select
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              carregar(e.target.value, to);
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
          >
            {meses.map((m) => (
              <option key={m} value={m}>
                {fmtMes(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-500">
          até
          <select
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              carregar(from, e.target.value);
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
          >
            {meses.map((m) => (
              <option key={m} value={m}>
                {fmtMes(m)}
              </option>
            ))}
          </select>
        </label>
        {loading && <span className="text-xs text-slate-400">carregando…</span>}
      </div>

      {data && (
        <>
          {/* Hero: contatos perdidos no período + tendência */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Contatos perdidos no período
              </div>
              <div className="mt-2 text-4xl font-bold tabular-nums text-slate-900">
                {nf.format(data.total)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {fmtMes(data.from)} – {fmtMes(data.to)} · média {nf.format(Math.round(data.total / mesesMedia))}/mês
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Perdas por mês
              </div>
              <div style={{ width: "100%", height: 96 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2a78d6" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="mes"
                      tickFormatter={fmtMes}
                      tick={{ fontSize: 10, fill: MUTED }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<TT />} labelFormatter={(l: unknown) => fmtMes(String(l))} />
                    <Area
                      type="monotone"
                      dataKey="n"
                      name="Perdas"
                      stroke="#2a78d6"
                      strokeWidth={2}
                      fill="url(#gTrend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Gráfico 1 — Motivos de perda */}
            <ChartCard
              titulo="1 · Motivos de perda"
              subtitulo={`% dos ${nf.format(data.total)} contatos perdidos no período (top 10)`}
              altura={Math.max(280, motivosChart.length * 30)}
            >
              <BarChart
                data={motivosChart}
                layout="vertical"
                margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
                barCategoryGap={6}
              >
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="motivoCurto"
                  width={190}
                  tick={{ fontSize: 11, fill: INK }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TT />} />
                <Bar dataKey="n" name="Perdas" fill="#2a78d6" radius={[0, 4, 4, 0]}>
                  <LabelList
                    dataKey="pct"
                    position="right"
                    formatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
                    style={{ fontSize: 11, fill: MUTED }}
                  />
                </Bar>
              </BarChart>
            </ChartCard>

            {/* Gráfico 3 — Perda por canal */}
            <ChartCard
              titulo="3 · Perda por canal"
              subtitulo="Mídia Paga (rd contém 'pag') · Base Interna ('campaign') · Outros"
              altura={Math.max(280, data.canais.length * 64 + 40)}
            >
              <BarChart
                data={data.canais}
                layout="vertical"
                margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
                barCategoryGap={16}
              >
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="canal"
                  width={110}
                  tick={{ fontSize: 12, fill: INK }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TT />} />
                <Bar dataKey="n" name="Perdas" radius={[0, 4, 4, 0]}>
                  {data.canais.map((c) => (
                    <Cell key={c.canal} fill={CANAL_COR[c.canal] ?? GRAY} />
                  ))}
                  <LabelList
                    dataKey="pct"
                    position="right"
                    formatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
                    style={{ fontSize: 11, fill: MUTED }}
                  />
                </Bar>
              </BarChart>
            </ChartCard>

            {/* Gráfico 2 — Motivo por empreendimento (top 3 motivos) */}
            <ChartCard
              titulo="2 · Motivo por empreendimento"
              subtitulo={`Top 10 empreendimentos · 3 motivos de maior volume: ${data.motivosTop3
                .map((m) => encurta(m, 20))
                .join(", ")}`}
              altura={Math.max(300, data.empreendimentos.length * 34 + 40)}
            >
              <BarChart
                data={data.empreendimentos}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                barCategoryGap={6}
              >
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={150}
                  tick={{ fontSize: 11, fill: INK }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TT />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.motivosTop3.map((m, i) => (
                  <Bar
                    key={m}
                    dataKey={m}
                    name={encurta(m, 22)}
                    stackId="s"
                    fill={corSerie(m, i)}
                    radius={i === data.motivosTop3.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ChartCard>

            {/* Gráfico 4 — Motivo por etapa */}
            <ChartCard
              titulo="4 · Motivo de perda por etapa"
              subtitulo="Quantidade e motivo de lost em cada etapa do funil (ordem do funil)"
              altura={Math.max(360, data.etapas.length * 30 + 40)}
            >
              <BarChart
                data={data.etapas}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                barCategoryGap={5}
              >
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={130}
                  tick={{ fontSize: 11, fill: INK }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TT />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {data.motivosEtapa.map((m, i) => (
                  <Bar
                    key={m}
                    dataKey={m}
                    name={encurta(m, 20)}
                    stackId="e"
                    fill={corSerie(m, i)}
                  />
                ))}
              </BarChart>
            </ChartCard>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            {data.meta.fonte}. {data.meta.obs} Canal: {data.meta.canalRegra}.
          </p>
        </>
      )}
    </div>
  );
}
