import snapshotRaw from "@/data/losts-marketplace.json";
import { db } from "@/lib/db";

// ─── Tipos (grão = deal, com data exata da perda) ─────────────────────────────
export interface Etapa {
  nome: string;
  ordem: number;
}
export interface LostsData {
  meta: {
    pipelineId: number;
    funil: string;
    criterioData: string;
    fonte: string;
    canalRegra: string;
    grao: string;
  };
  base: string; // "AAAA-MM-DD" — data base dos offsets
  minDate: string;
  maxDate: string;
  motivos: string[];
  empreendimentos: string[];
  etapas: Etapa[];
  canais: string[];
  deals: number[][]; // [offsetDias, motivoIdx, empreendIdx, etapaIdx, canalIdx]
}

const snapshot = snapshotRaw as LostsData;
const OUTROS = "Outros";
const DIA = 86400000;

const toUTC = (d: string) => Date.parse(d + "T00:00:00Z");
export function offsetOf(base: string, date: string): number {
  return Math.round((toUTC(date) - toUTC(base)) / DIA);
}
function mesDe(base: string, offset: number): string {
  const d = new Date(toUTC(base) + offset * DIA);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ─── Fonte: tabela sincronizada da Nekt (fallback = snapshot) ─────────────────
interface DealRow {
  lostDate: Date;
  motivo: string;
  empreendimento: string;
  etapa: string;
  etapaOrdem: number;
  canal: string;
}
function buildFromRows(rows: DealRow[]): LostsData {
  const motivos: string[] = [], mI = new Map<string, number>();
  const emps: string[] = [], eI = new Map<string, number>();
  const etapas: Etapa[] = [], sI = new Map<string, number>();
  const canais: string[] = [], cI = new Map<string, number>();
  const idx = (arr: string[], map: Map<string, number>, v: string) => {
    let i = map.get(v);
    if (i === undefined) { i = arr.length; arr.push(v); map.set(v, i); }
    return i;
  };
  const base = "2025-01-01";
  const deals: number[][] = [];
  let min = "9999", max = "0";
  for (const r of rows) {
    const iso = r.lostDate.toISOString().slice(0, 10);
    if (iso < min) min = iso;
    if (iso > max) max = iso;
    let si = sI.get(r.etapa);
    if (si === undefined) { si = etapas.length; etapas.push({ nome: r.etapa, ordem: r.etapaOrdem }); sI.set(r.etapa, si); }
    deals.push([offsetOf(base, iso), idx(motivos, mI, r.motivo), idx(emps, eI, r.empreendimento), si, idx(canais, cI, r.canal)]);
  }
  return { meta: { ...snapshot.meta, fonte: "Nekt (sync ao vivo) · pipeline 37, status=lost" }, base, minDate: min, maxDate: max, motivos, empreendimentos: emps, etapas, canais, deals };
}

export async function getLostsData(): Promise<LostsData> {
  try {
    const rows = (await db.marketplaceLost.findMany()) as unknown as DealRow[];
    if (rows && rows.length > 0) return buildFromRows(rows);
  } catch {
    // tabela não migrada / sync não configurado → snapshot
  }
  return snapshot;
}

// ─── Agregação por intervalo de datas (inclusivo) ─────────────────────────────
export interface MotivoN {
  motivo: string;
  n: number;
  pct: number;
}
/** Um empreendimento com seus 5 motivos de maior volume. */
export interface EmpreendAgg {
  label: string;
  total: number;
  motivos: MotivoN[]; // top 5 do próprio empreendimento
}
/** Uma etapa do funil: barra empilhada (top6+Outros) + lista completa p/ tooltip. */
export interface EtapaAgg {
  label: string;
  ordem: number;
  total: number;
  stack: Record<string, number>; // séries visíveis (top6 globais + Outros)
  full: { motivo: string; n: number }[]; // TODOS os motivos, sem agrupar
}
export interface Aggregated {
  from: string;
  to: string;
  total: number;
  trend: { mes: string; n: number }[];
  motivos: MotivoN[];
  canais: { canal: string; n: number; pct: number }[];
  empreendimentos: EmpreendAgg[]; // TODOS
  etapas: EtapaAgg[];
  motivosEtapa: string[]; // séries do gráfico 4 (top6 globais + Outros)
}

export function aggregate(data: LostsData, from: string, to: string): Aggregated {
  const fromOff = offsetOf(data.base, from);
  const toOff = offsetOf(data.base, to);
  const { motivos: M, empreendimentos: E, etapas: S, canais: C } = data;

  const motivoN = new Array(M.length).fill(0);
  const canalN = new Array(C.length).fill(0);
  const trendMap = new Map<string, number>();
  let total = 0;
  // por empreendimento: empIdx -> (motivoIdx -> n)
  const empPorMotivo = new Map<number, Map<number, number>>();
  // por etapa: etapaIdx -> (motivoIdx -> n)
  const etapaPorMotivo = new Map<number, Map<number, number>>();

  for (const [off, mi, ei, si, ci] of data.deals) {
    if (off < fromOff || off > toOff) continue;
    total++;
    motivoN[mi]++;
    canalN[ci]++;
    const mes = mesDe(data.base, off);
    trendMap.set(mes, (trendMap.get(mes) ?? 0) + 1);
    let em = empPorMotivo.get(ei);
    if (!em) { em = new Map(); empPorMotivo.set(ei, em); }
    em.set(mi, (em.get(mi) ?? 0) + 1);
    let sm = etapaPorMotivo.get(si);
    if (!sm) { sm = new Map(); etapaPorMotivo.set(si, sm); }
    sm.set(mi, (sm.get(mi) ?? 0) + 1);
  }

  const motivos = motivoN
    .map((n, i) => ({ motivo: M[i], n, pct: total ? (n / total) * 100 : 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const ordemCanal = ["Midia Paga", "Base Interna", "Outros"];
  const canais = canalN
    .map((n, i) => ({ canal: C[i], n, pct: total ? (n / total) * 100 : 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => ordemCanal.indexOf(a.canal) - ordemCanal.indexOf(b.canal));

  const trend = [...trendMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([mes, n]) => ({ mes, n }));

  // top motivos globais no período (índices) — usados só nas cores/séries do gráfico 4
  const rankMotivos = motivoN.map((n, i) => [i, n] as [number, number]).sort((a, b) => b[1] - a[1]);
  const top6 = rankMotivos.slice(0, 6).filter(([, n]) => n > 0).map(([i]) => i);
  const top6Set = new Set(top6);
  const motivosEtapa = [...top6.map((i) => M[i]), OUTROS];

  // Gráfico 2 — TODOS os empreendimentos, cada um com seus 5 motivos de maior volume
  const empreendimentos: EmpreendAgg[] = [...empPorMotivo.entries()]
    .map(([ei, mm]) => {
      const label = E[ei];
      const total = [...mm.values()].reduce((a, b) => a + b, 0);
      const motivos = [...mm.entries()]
        .map(([mi, n]) => ({ motivo: M[mi], n, pct: total ? (n / total) * 100 : 0 }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 5);
      return { label, total, motivos };
    })
    .filter((e) => e.label && e.label !== "Aguardando definição" && e.total > 0)
    .sort((a, b) => b.total - a.total);

  // Gráfico 4 — etapa (ordem do funil): barra empilhada (top6+Outros) + lista completa
  const etapas: EtapaAgg[] = [...etapaPorMotivo.entries()]
    .map(([si, mm]) => {
      const total = [...mm.values()].reduce((a, b) => a + b, 0);
      const stack: Record<string, number> = {};
      for (const nome of motivosEtapa) stack[nome] = 0;
      const full: { motivo: string; n: number }[] = [];
      for (const [mi, n] of mm) {
        const nome = M[mi];
        full.push({ motivo: nome, n });
        stack[top6Set.has(mi) ? nome : OUTROS] += n;
      }
      full.sort((a, b) => b.n - a.n);
      return { label: S[si].nome, ordem: S[si].ordem, total, stack, full };
    })
    .sort((a, b) => a.ordem - b.ordem);

  return { from, to, total, trend, motivos, canais, empreendimentos, etapas, motivosEtapa };
}

/** Intervalo padrão: últimos ~6 meses (do 1º dia do mês -5 até maxDate). */
export function defaultRange(data: LostsData): { from: string; to: string } {
  const max = new Date(toUTC(data.maxDate));
  const y = max.getUTCFullYear();
  const m = max.getUTCMonth();
  const fromDate = new Date(Date.UTC(y, m - 5, 1));
  const fromIso = fromDate.toISOString().slice(0, 10);
  const from = fromIso < data.minDate ? data.minDate : fromIso;
  return { from, to: data.maxDate };
}
