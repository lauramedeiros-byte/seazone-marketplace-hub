"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/back-button";

interface Campanha {
  c: string;
  d: string | null;
  leads: number;
  sql: number;
  fup: number;
  contrato: number;
  won: number;
}
interface Payload {
  meta: { tipo: string; filtro: string; fonte: string; faixasSQL: string };
  campaigns: Campanha[];
}

const PESOS = { won: 15, contrato: 8, fup: 4, sql: 1 };
const scoreDe = (c: Campanha) => c.won * PESOS.won + c.contrato * PESOS.contrato + c.fup * PESOS.fup + c.sql * PESOS.sql;
const nf = new Intl.NumberFormat("pt-BR");
const fmtData = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

// melhor etapa alcançada → cor/rótulo do termômetro
function tier(c: Campanha): { label: string; cor: string } {
  if (c.won > 0) return { label: "WON", cor: "#059669" };
  if (c.contrato > 0) return { label: "Contrato", cor: "#2a78d6" };
  if (c.fup > 0) return { label: "Reunião", cor: "#eda100" };
  if (c.sql > 0) return { label: "SQL", cor: "#8b93a7" };
  return { label: "—", cor: "#cbd5e1" };
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const compact = (s: string) => norm(s).replace(/[\s_\-]/g, "");

// padrões extraídos do nome do [RD] Campanha (match no nome "compactado")
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

  // campanhas no período (sem data entram sempre)
  const campanhas = useMemo(() => {
    if (!data) return [];
    return data.campaigns
      .filter((c) => !c.d || (c.d >= from && c.d <= to))
      .map((c) => ({ ...c, score: scoreDe(c) }))
      .sort((a, b) => b.score - a.score || b.won - a.won || b.contrato - a.contrato || b.fup - a.fup);
  }, [data, from, to]);

  const maxScore = Math.max(...campanhas.map((c) => c.score), 1);
  const tot = campanhas.reduce(
    (a, c) => ({ leads: a.leads + c.leads, sql: a.sql + c.sql, fup: a.fup + c.fup, contrato: a.contrato + c.contrato, won: a.won + c.won }),
    { leads: 0, sql: 0, fup: 0, contrato: 0, won: 0 }
  );

  // padrões
  const padroes = useMemo(() => {
    const list = PADROES.map((p) => {
      const ms = campanhas.filter((c) => p.test(compact(c.c)));
      const agg = ms.reduce(
        (a, c) => ({ leads: a.leads + c.leads, sql: a.sql + c.sql, fup: a.fup + c.fup, contrato: a.contrato + c.contrato, won: a.won + c.won, score: a.score + c.score }),
        { leads: 0, sql: 0, fup: 0, contrato: 0, won: 0, score: 0 }
      );
      return { label: p.label, nCamp: ms.length, ...agg, perLead: agg.leads ? agg.score / agg.leads : 0, sqlRate: agg.leads ? (agg.sql / agg.leads) * 100 : 0, fupRate: agg.leads ? (agg.fup / agg.leads) * 100 : 0 };
    }).filter((p) => p.nCamp > 0 && p.leads > 0);
    return list.sort((a, b) => b.perLead - a.perLead);
  }, [campanhas]);

  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400";
  const td = "px-3 py-2 text-sm text-slate-700 tabular-nums";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <BackButton />
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-slate-900">Análise de disparo — base interna</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ranking das campanhas de disparo da base interna (Pipedrive · pipeline 37). Base interna = disparos RD/MIA (não mídia paga).
          Termômetro pondera as etapas alcançadas: <strong>WON › Contrato › Reunião Realizada › SQL</strong>.
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
        {loading && <span className="text-xs text-slate-400">carregando…</span>}
      </div>

      {data && (
        <>
          {/* resumo */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { k: "Campanhas", v: campanhas.length },
              { k: "Leads", v: tot.leads },
              { k: "SQL", v: tot.sql },
              { k: "Reunião/FUP", v: tot.fup },
              { k: "WON", v: tot.won },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{s.k}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{nf.format(s.v)}</div>
              </div>
            ))}
          </div>

          {/* Tabela 1 — ranking */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Ranking das campanhas</div>
            <div className="mb-3 mt-0.5 text-xs text-slate-500">Ordenadas pelo termômetro (quanto mais fundo levou o lead, melhor). Atualiza com o sync da Nekt.</div>
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200">
                    <th className={th}>#</th>
                    <th className={th}>Campanha</th>
                    <th className={th}>Data</th>
                    <th className={`${th} text-right`}>Leads</th>
                    <th className={`${th} text-right`}>SQL</th>
                    <th className={`${th} text-right`}>Reunião/FUP</th>
                    <th className={`${th} text-right`}>Contrato</th>
                    <th className={`${th} text-right`}>WON</th>
                    <th className={th}>Termômetro</th>
                  </tr>
                </thead>
                <tbody>
                  {campanhas.map((c, i) => {
                    const t = tier(c);
                    return (
                      <tr key={c.c} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className={`${td} text-slate-400`}>{i + 1}</td>
                        <td className="max-w-[320px] truncate px-3 py-2 text-sm text-slate-800" title={c.c}>{c.c}</td>
                        <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtData(c.d)}</td>
                        <td className={`${td} text-right`}>{nf.format(c.leads)}</td>
                        <td className={`${td} text-right`}>{nf.format(c.sql)}</td>
                        <td className={`${td} text-right`}>{nf.format(c.fup)}</td>
                        <td className={`${td} text-right`}>{nf.format(c.contrato)}</td>
                        <td className={`${td} text-right font-semibold ${c.won ? "text-emerald-600" : "text-slate-300"}`}>{nf.format(c.won)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full" style={{ width: `${Math.max((c.score / maxScore) * 100, 3)}%`, background: t.cor }} />
                            </div>
                            <span className="w-16 text-[11px] font-medium" style={{ color: t.cor }}>{t.label}</span>
                          </div>
                        </td>
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
              Agrupa campanhas por padrão no nome do <code>[RD] Campanha</code>. Índice = pontuação do termômetro por lead (quanto maior, mais o padrão empurra leads pro fundo do funil).
            </div>
            {padroes[0] && (
              <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-slate-700">
                💡 Destaque: campanhas com <strong>{padroes[0].label}</strong> têm o melhor índice de avanço ({padroes[0].fupRate.toFixed(1)}% chegam à Reunião/FUP, em {padroes[0].nCamp} campanha{padroes[0].nCamp > 1 ? "s" : ""}).
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={th}>Padrão</th>
                    <th className={`${th} text-right`}>Campanhas</th>
                    <th className={`${th} text-right`}>Leads</th>
                    <th className={`${th} text-right`}>SQL %</th>
                    <th className={`${th} text-right`}>Reunião/FUP %</th>
                    <th className={`${th} text-right`}>WON</th>
                    <th className={`${th} text-right`}>Índice /lead</th>
                  </tr>
                </thead>
                <tbody>
                  {padroes.map((p) => (
                    <tr key={p.label} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-sm text-slate-800">{p.label}</td>
                      <td className={`${td} text-right`}>{p.nCamp}</td>
                      <td className={`${td} text-right`}>{nf.format(p.leads)}</td>
                      <td className={`${td} text-right`}>{p.sqlRate.toFixed(1)}%</td>
                      <td className={`${td} text-right`}>{p.fupRate.toFixed(1)}%</td>
                      <td className={`${td} text-right ${p.won ? "font-semibold text-emerald-600" : "text-slate-300"}`}>{nf.format(p.won)}</td>
                      <td className={`${td} text-right font-semibold text-slate-900`}>{p.perLead.toFixed(2)}</td>
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
