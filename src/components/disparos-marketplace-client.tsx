"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/back-button";

interface Campanha {
  c: string;
  d: string | null;
  leads: number;
  sql: number; // chegou à faixa Contatados→Reunião Agendada
  fup: number; // Reunião Realizada concluída (>= FUP) ou won
  contrato: number;
  won: number;
}
interface Payload {
  meta: { tipo: string; filtro: string; fonte: string; faixasSQL: string; snapshotAt?: string };
  source: "nekt" | "snapshot";
  lastSync: string | null;
  campaigns: Campanha[];
}

// status do sync (a cada 4h): verde ok / amarelo atrasado / cinza snapshot
function statusSync(p: Payload): { cor: string; bg: string; txt: string } {
  if (p.source === "nekt" && p.lastSync) {
    const dt = new Date(p.lastSync);
    const ageH = (Date.now() - dt.getTime()) / 3.6e6;
    const quando = dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    if (ageH <= 5) return { cor: "#059669", bg: "#ecfdf5", txt: `Dados atualizados · última sincronização ${quando}` };
    return { cor: "#b45309", bg: "#fffbeb", txt: `Sync atrasado — última sincronização ${quando} (há ~${Math.round(ageH)}h). Pode ter falhado.` };
  }
  const q = p.meta.snapshotAt ? ` de ${p.meta.snapshotAt.split("-").reverse().join("/")}` : "";
  return { cor: "#64748b", bg: "#f1f5f9", txt: `Snapshot fixo${q} — sync automático ainda não ativo (dados não atualizam sozinhos).` };
}

const nf = new Intl.NumberFormat("pt-BR");
const fmtData = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

// Farol: quão fundo a campanha levou os leads
function farol(c: Campanha): { cor: string; bg: string; label: string } {
  if (c.fup > 0) return { cor: "#059669", bg: "#ecfdf5", label: "Levou à Reunião+" };
  if (c.sql > 0) return { cor: "#b45309", bg: "#fffbeb", label: "Só até SQL" };
  return { cor: "#dc2626", bg: "#fef2f2", label: "Não avançou" };
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const compact = (s: string) => norm(s).replace(/[\s_\-]/g, "");

const PADROES: { label: string; test: (c: string) => boolean }[] = [
  { label: "Timing (lost por timing)", test: (c) => c.includes("timing") },
  { label: "Oportunidade da semana", test: (c) => c.includes("oportunidadedasemana") },
  { label: "Hóspedes", test: (c) => c.includes("hospedes") || c.includes("hosp") },
  { label: "Lost + Opp (LostOp)", test: (c) => c.includes("lostop") },
  { label: "Não abriram o disparo", test: (c) => c.includes("naoabriram") },
  { label: "Abriram o disparo", test: (c) => c.includes("abriram") && !c.includes("naoabriram") },
  { label: "Repescagem SLA", test: (c) => c.includes("repescagem") },
  { label: "Recuperação de losts", test: (c) => c.includes("recuperacao") },
  { label: "Fechamento de mês/grupo", test: (c) => c.includes("fechamento") },
  { label: "Lost com reunião", test: (c) => c.includes("lostcomreuni") || (c.includes("lost") && c.includes("reuni")) },
  { label: "Oportunidade imperdível", test: (c) => c.includes("imperdivel") },
  { label: "Lost (menção geral)", test: (c) => c.includes("lost") },
];

// ordena da campanha que levou leads mais fundo para a que menos levou
const porAvanco = (a: Campanha, b: Campanha) =>
  b.won - a.won || b.contrato - a.contrato || b.fup - a.fup || b.sql - a.sql || b.leads - a.leads;

function ultimosMeses(maxD: string, n: number, minD: string) {
  const [y, m] = maxD.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - (n - 1), 1)).toISOString().slice(0, 10);
  return { from: d < minD ? minD : d, to: maxD };
}

export function DisparosMarketplaceClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cur, setCur] = useState<string>("6");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/disparos-marketplace");
    const json: Payload = await res.json();
    const datas = json.campaigns.map((c) => c.d).filter(Boolean).sort() as string[];
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

  const campanhas = useMemo(() => {
    if (!data) return [];
    const termo = norm(q.trim());
    return data.campaigns
      .filter((c) => !c.d || (c.d >= from && c.d <= to))
      .filter((c) => !termo || norm(c.c).includes(termo))
      .slice()
      .sort(porAvanco);
  }, [data, from, to, q]);

  const tot = campanhas.reduce(
    (a, c) => ({ leads: a.leads + c.leads, sql: a.sql + c.sql, fup: a.fup + c.fup, contrato: a.contrato + c.contrato, won: a.won + c.won }),
    { leads: 0, sql: 0, fup: 0, contrato: 0, won: 0 }
  );
  const verdes = campanhas.filter((c) => c.fup > 0).length;

  // padrões — ranqueados por % de leads que chegaram à Reunião/FUP
  const padroes = useMemo(() => {
    return PADROES.map((p) => {
      const ms = campanhas.filter((c) => p.test(compact(c.c)));
      const agg = ms.reduce(
        (a, c) => ({ leads: a.leads + c.leads, sql: a.sql + c.sql, fup: a.fup + c.fup, won: a.won + c.won }),
        { leads: 0, sql: 0, fup: 0, won: 0 }
      );
      return { label: p.label, nCamp: ms.length, ...agg, sqlRate: agg.leads ? (agg.sql / agg.leads) * 100 : 0, fupRate: agg.leads ? (agg.fup / agg.leads) * 100 : 0 };
    })
      .filter((p) => p.nCamp > 0 && p.leads > 0)
      .sort((a, b) => b.fupRate - a.fupRate || b.fup - a.fup || b.leads - a.leads);
  }, [campanhas]);

  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400";
  const td = "px-3 py-2 text-sm text-slate-700 tabular-nums";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <BackButton />
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-slate-900">Análise de disparo — base interna</h1>
        <p className="mt-1 text-sm text-slate-500">
          Campanhas de disparo da base interna (Pipedrive · pipeline 37 — disparos RD/MIA, sem mídia paga). Para cada campanha,
          quantos leads <strong>avançaram em cada etapa</strong> do funil, e um <strong>farol</strong> de quão fundo ela levou.
        </p>
      </div>

      {/* filtro */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Período (data da campanha)</span>
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
          <input type="date" value={from} min={min} max={to || max} onChange={(e) => { setCur(""); setFrom(e.target.value); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          até
          <input type="date" value={to} min={from || min} max={max} onChange={(e) => { setCur(""); setTo(e.target.value); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800" />
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar campanha…"
            className="w-56 rounded-md border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>
        {q && <span className="text-xs text-slate-400">{campanhas.length} resultado(s)</span>}
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

          {/* resumo */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { k: "Campanhas", v: nf.format(campanhas.length) },
              { k: "🟢 Levaram à Reunião+", v: nf.format(verdes) },
              { k: "Leads", v: nf.format(tot.leads) },
              { k: "→ Reunião/FUP", v: nf.format(tot.fup) },
              { k: "→ WON", v: nf.format(tot.won) },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{s.k}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{s.v}</div>
              </div>
            ))}
          </div>

          {/* Tabela 1 — leads por etapa + farol */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Leads que avançaram, por etapa</div>
            <div className="mb-3 mt-0.5 text-xs text-slate-500">
              Cada coluna = quantos leads da campanha <strong>chegaram até aquela etapa</strong> (acumulado). Farol: 🟢 levou à Reunião ou além · 🟡 só até SQL · 🔴 não avançou. Ordenado do que levou mais fundo.
            </div>
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200">
                    <th className={th}>Farol</th>
                    <th className={th}>Campanha</th>
                    <th className={th}>Data</th>
                    <th className={`${th} text-right`}>Leads</th>
                    <th className={`${th} text-right`}>→ SQL</th>
                    <th className={`${th} text-right`}>→ Reunião/FUP</th>
                    <th className={`${th} text-right`}>→ Contrato</th>
                    <th className={`${th} text-right`}>→ WON</th>
                  </tr>
                </thead>
                <tbody>
                  {campanhas.map((c) => {
                    const f = farol(c);
                    return (
                      <tr key={c.c} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: f.cor, background: f.bg }}>
                            <span className="h-2 w-2 rounded-full" style={{ background: f.cor }} />
                            {f.label}
                          </span>
                        </td>
                        <td className="max-w-[300px] truncate px-3 py-2 text-sm text-slate-800" title={c.c}>{c.c}</td>
                        <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtData(c.d)}</td>
                        <td className={`${td} text-right`}>{nf.format(c.leads)}</td>
                        <td className={`${td} text-right`}>{nf.format(c.sql)}</td>
                        <td className={`${td} text-right font-semibold ${c.fup ? "text-amber-600" : "text-slate-300"}`}>{nf.format(c.fup)}</td>
                        <td className={`${td} text-right ${c.contrato ? "text-blue-600" : "text-slate-300"}`}>{nf.format(c.contrato)}</td>
                        <td className={`${td} text-right font-semibold ${c.won ? "text-emerald-600" : "text-slate-300"}`}>{nf.format(c.won)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela 2 — padrões */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Padrões que mais avançam leads</div>
            <div className="mb-3 mt-0.5 text-xs text-slate-500">
              Agrupa campanhas por padrão no nome do <code>[RD] Campanha</code>, ordenado pela <strong>% de leads que chegaram à Reunião/FUP</strong>.
            </div>
            {padroes[0] && (
              <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-slate-700">
                💡 Destaque: campanhas com <strong>{padroes[0].label}</strong> levam mais leads pra frente — {padroes[0].fupRate.toFixed(1)}% chegam à Reunião/FUP ({nf.format(padroes[0].fup)} de {nf.format(padroes[0].leads)} leads, em {padroes[0].nCamp} campanha{padroes[0].nCamp > 1 ? "s" : ""}).
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={th}>Padrão</th>
                    <th className={`${th} text-right`}>Campanhas</th>
                    <th className={`${th} text-right`}>Leads</th>
                    <th className={`${th} text-right`}>% até SQL</th>
                    <th className={`${th} text-right`}>% até Reunião/FUP</th>
                    <th className={`${th} text-right`}>WON</th>
                  </tr>
                </thead>
                <tbody>
                  {padroes.map((p) => (
                    <tr key={p.label} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-sm text-slate-800">{p.label}</td>
                      <td className={`${td} text-right`}>{p.nCamp}</td>
                      <td className={`${td} text-right`}>{nf.format(p.leads)}</td>
                      <td className={`${td} text-right`}>{p.sqlRate.toFixed(1)}%</td>
                      <td className={`${td} text-right font-semibold text-amber-600`}>{p.fupRate.toFixed(1)}%</td>
                      <td className={`${td} text-right ${p.won ? "font-semibold text-emerald-600" : "text-slate-300"}`}>{nf.format(p.won)}</td>
                    </tr>
                  ))}
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
