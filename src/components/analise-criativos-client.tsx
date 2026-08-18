"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/back-button";

interface Criativo {
  c: string;
  p: string;
  d: string | null;
  leads: number;
  sql: number; // cumulativo
  reuniao: number; // cumulativo
  contrato: number; // cumulativo
  won: number;
}
interface Payload {
  meta: { tipo: string; filtro: string; fonte: string; faixasSQL: string; snapshotAt?: string };
  source: "nekt" | "snapshot";
  lastSync: string | null;
  criativos: Criativo[];
}

type SortKey = "won" | "contrato" | "reuniao" | "leads";

function statusSync(p: Payload): { cor: string; bg: string; txt: string } {
  if (p.source === "nekt" && p.lastSync) {
    const dt = new Date(p.lastSync);
    const ageH = (Date.now() - dt.getTime()) / 3.6e6;
    const quando = dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    if (ageH <= 30) return { cor: "#059669", bg: "#ecfdf5", txt: `Dados atualizados · última sincronização ${quando}` };
    return { cor: "#b45309", bg: "#fffbeb", txt: `Sync atrasado — última sincronização ${quando} (há ~${Math.round(ageH)}h).` };
  }
  const q = p.meta.snapshotAt ? ` de ${p.meta.snapshotAt.split("-").reverse().join("/")}` : "";
  return { cor: "#64748b", bg: "#f1f5f9", txt: `Snapshot fixo${q} — sync automático ainda não ativo.` };
}

const nf = new Intl.NumberFormat("pt-BR");
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const nomeCriativo = (c: string) => c.replace(/_/g, " ").trim();

const PLAT_COR: Record<string, { cor: string; bg: string }> = {
  Meta: { cor: "#1d4ed8", bg: "#eff6ff" },
  Google: { cor: "#059669", bg: "#ecfdf5" },
  Outros: { cor: "#64748b", bg: "#f1f5f9" },
};

// Farol: etapa mais profunda que o criativo alcançou (cumulativo)
function farol(c: Criativo): { cor: string; bg: string; label: string } {
  if (c.won > 0) return { cor: "#059669", bg: "#ecfdf5", label: "Gerou WON" };
  if (c.contrato > 0) return { cor: "#1d4ed8", bg: "#eff6ff", label: "Chegou a Contrato" };
  if (c.reuniao > 0) return { cor: "#b45309", bg: "#fffbeb", label: "Chegou à Reunião" };
  if (c.sql > 0) return { cor: "#6366f1", bg: "#eef2ff", label: "Só até SQL" };
  return { cor: "#dc2626", bg: "#fef2f2", label: "Não avançou" };
}

function ultimosMeses(maxD: string, n: number, minD: string) {
  const [y, m] = maxD.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - (n - 1), 1)).toISOString().slice(0, 10);
  return { from: d < minD ? minD : d, to: maxD };
}

export function AnaliseCriativosClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cur, setCur] = useState<string>("6");
  const [q, setQ] = useState("");
  const [plat, setPlat] = useState<string>("Todas");
  const [sortBy, setSortBy] = useState<SortKey>("won");
  const [loading, setLoading] = useState(true);

  const hoje = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/analise-criativos");
    const json: Payload = await res.json();
    const datas = json.criativos.map((c) => c.d).filter(Boolean).sort() as string[];
    const mn = datas[0] ?? "";
    const mx = datas[datas.length - 1] ?? "";
    setData(json);
    setMin(mn);
    setMax(mx);
    const r = ultimosMeses(mx, 6, mn);
    setFrom(r.from);
    setTo(r.to);
    setLoading(false);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const preset = (n: number | "all") => {
    setCur(String(n));
    if (n === "all") { setFrom(min); setTo(max); }
    else { const r = ultimosMeses(max, n, min); setFrom(r.from); setTo(r.to); }
  };

  const plataformas = useMemo(() => {
    const s = new Set<string>();
    data?.criativos.forEach((c) => s.add(c.p));
    return ["Todas", ...[...s].sort()];
  }, [data]);

  const criativos = useMemo(() => {
    if (!data) return [];
    const termo = norm(q.trim());
    const cmp = (a: Criativo, b: Criativo) =>
      b[sortBy] - a[sortBy] || b.won - a.won || b.contrato - a.contrato || b.reuniao - a.reuniao || b.leads - a.leads;
    return data.criativos
      .filter((c) => c.d != null && c.d >= from && c.d <= to)
      .filter((c) => plat === "Todas" || c.p === plat)
      .filter((c) => !termo || norm(c.c).includes(termo))
      .slice()
      .sort(cmp);
  }, [data, from, to, q, plat, sortBy]);

  const tot = criativos.reduce(
    (a, c) => ({ leads: a.leads + c.leads, sql: a.sql + c.sql, reuniao: a.reuniao + c.reuniao, contrato: a.contrato + c.contrato, won: a.won + c.won }),
    { leads: 0, sql: 0, reuniao: 0, contrato: 0, won: 0 }
  );
  const comWon = criativos.filter((c) => c.won > 0).length;

  const sorts: { k: SortKey; label: string }[] = [
    { k: "won", label: "Mais WON" },
    { k: "contrato", label: "Mais Contrato" },
    { k: "reuniao", label: "Mais Reunião" },
    { k: "leads", label: "Mais Leads" },
  ];

  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400";
  const td = "px-3 py-2 text-sm text-slate-700 tabular-nums";
  const thBtn = (k: SortKey, label: string) => (
    <th
      className={`${th} cursor-pointer select-none text-right hover:text-slate-600 ${sortBy === k ? "text-blue-600" : ""}`}
      onClick={() => setSortBy(k)}
      title="Ordenar por esta coluna"
    >
      {label} {sortBy === k ? "▾" : ""}
    </th>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <BackButton />
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-slate-900">Análise de mídia paga — criativos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Criativos de mídia paga (Pipedrive · funil Marketplace, pipeline 37 — <code>rd_source</code> contém “pag”, sem “campaign”).
          Números <strong>cumulativos</strong>: chegar a uma etapa conta em todas as anteriores (quem virou WON também soma em Contrato/Reunião/SQL).
        </p>
      </div>

      {/* filtro */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Período</span>
        {([{ l: "3 meses", v: 3 }, { l: "6 meses", v: 6 }, { l: "12 meses", v: 12 }, { l: "Tudo", v: "all" }] as const).map((p) => (
          <button
            key={p.l}
            onClick={() => preset(p.v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              cur === String(p.v) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {p.l}
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          De
          <input type="date" value={from} min={min} max={to || hoje} onChange={(e) => { setCur(""); setFrom(e.target.value); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          até
          <input type="date" value={to} min={from || min} max={hoje} onChange={(e) => { setCur(""); setTo(e.target.value); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800" />
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar criativo…" className="w-56 rounded-md border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs text-slate-800 placeholder:text-slate-400" />
        </div>
        {loading && <span className="text-xs text-slate-400">carregando…</span>}
      </div>

      {/* ordenar + plataforma */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ordenar por</span>
        {sorts.map((s) => (
          <button
            key={s.k}
            onClick={() => setSortBy(s.k)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              sortBy === s.k ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plataforma</span>
        {plataformas.map((pf) => (
          <button
            key={pf}
            onClick={() => setPlat(pf)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              plat === pf ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {pf}
          </button>
        ))}
      </div>

      {data && (
        <>
          {(() => {
            const s = statusSync(data);
            return (
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ color: s.cor, background: s.bg }}>
                <span className="h-2 w-2 rounded-full" style={{ background: s.cor }} />
                {s.txt}
              </div>
            );
          })()}

          {/* resumo */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { k: "Criativos", v: nf.format(criativos.length) },
              { k: "🟢 Geraram WON", v: nf.format(comWon) },
              { k: "Leads", v: nf.format(tot.leads) },
              { k: "→ Reunião", v: nf.format(tot.reuniao) },
              { k: "→ WON", v: nf.format(tot.won) },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{s.k}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{s.v}</div>
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Criativos por avanço no funil (cumulativo)</div>
            <div className="mb-3 mt-0.5 text-xs text-slate-500">
              Cada coluna mostra <strong>quantos leads o criativo levou até aquela etapa (ou além)</strong>. Clique num cabeçalho para ordenar. Farol = etapa mais profunda alcançada.
            </div>
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-[11px] leading-relaxed text-slate-600">
              <div className="mb-1.5 font-semibold uppercase tracking-wide text-slate-400">O que cada coluna considera (funil p37, cumulativo)</div>
              <div><strong className="text-slate-700">→ SQL</strong> — chegou a <strong>Contatados</strong> ou além</div>
              <div><strong className="text-amber-700">→ Reunião</strong> — chegou à <strong>Reunião Realizada</strong> ou além (inclui Negociação, Proposta, Reserva, Contrato, WON)</div>
              <div><strong className="text-blue-700">→ Contrato</strong> — chegou à etapa <strong>Contrato</strong> ou virou WON</div>
              <div><strong className="text-emerald-700">→ WON</strong> — negócio ganho</div>
            </div>
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200">
                    <th className={th}>Farol</th>
                    <th className={th}>Criativo</th>
                    <th className={th}>Plataforma</th>
                    {thBtn("leads", "Leads")}
                    <th className={`${th} text-right`}>→ SQL</th>
                    {thBtn("reuniao", "→ Reunião")}
                    {thBtn("contrato", "→ Contrato")}
                    {thBtn("won", "→ WON")}
                    <th className={`${th} text-right`}>Taxa WON</th>
                  </tr>
                </thead>
                <tbody>
                  {criativos.map((c) => {
                    const f = farol(c);
                    const pc = PLAT_COR[c.p] ?? PLAT_COR.Outros;
                    const tw = c.leads ? (c.won / c.leads) * 100 : 0;
                    return (
                      <tr key={`${c.c}__${c.p}`} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: f.cor, background: f.bg }}>
                            <span className="h-2 w-2 rounded-full" style={{ background: f.cor }} />
                            {f.label}
                          </span>
                        </td>
                        <td className="max-w-[320px] truncate px-3 py-2 text-sm text-slate-800" title={nomeCriativo(c.c)}>{nomeCriativo(c.c)}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: pc.cor, background: pc.bg }}>{c.p}</span>
                        </td>
                        <td className={`${td} text-right`}>{nf.format(c.leads)}</td>
                        <td className={`${td} text-right`}>{nf.format(c.sql)}</td>
                        <td className={`${td} text-right ${c.reuniao ? "text-amber-600" : "text-slate-300"}`}>{nf.format(c.reuniao)}</td>
                        <td className={`${td} text-right ${c.contrato ? "text-blue-600" : "text-slate-300"}`}>{nf.format(c.contrato)}</td>
                        <td className={`${td} text-right font-semibold ${c.won ? "text-emerald-600" : "text-slate-300"}`}>{nf.format(c.won)}</td>
                        <td className={`${td} text-right ${tw > 0 ? "text-slate-700" : "text-slate-300"}`}>{tw.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-400">{data.meta.fonte} · {data.meta.filtro}. {data.meta.faixasSQL}.</p>
        </>
      )}
    </div>
  );
}
