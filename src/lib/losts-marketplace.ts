import snapshotRaw from "@/data/losts-marketplace.json";
import { db } from "@/lib/db";

// ─── Tipos ──────────────────────────────────────────────────────────────────
export interface MotivoRow {
  mes: string;
  motivo: string;
  n: number;
}
export interface EmpreendRow {
  mes: string;
  empreendimento: string;
  motivo: string;
  n: number;
}
export interface CanalRow {
  mes: string;
  canal: string;
  n: number;
}
export interface EtapaRow {
  mes: string;
  etapaOrdem: number;
  etapa: string;
  motivo: string;
  n: number;
}
export interface LostsData {
  meta: {
    pipelineId: number;
    funil: string;
    criterioData: string;
    desde: string;
    ate: string;
    fonte: string;
    canalRegra: string;
    obs: string;
  };
  meses: string[];
  chart1_motivos: MotivoRow[];
  chart2_empreendimento: EmpreendRow[];
  chart3_canal: CanalRow[];
  chart4_etapa: EtapaRow[];
}

const snapshot = snapshotRaw as LostsData;

// ─── Fonte dos dados ──────────────────────────────────────────────────────────
// Preferência: tabela sincronizada da Nekt (marketplace_lost_agg). Se ela ainda
// não existir / estiver vazia (ex.: sync não configurado), cai para o snapshot
// versionado no repositório — assim o painel nunca quebra.
interface FlatRow {
  mes: string;
  chart: string;
  dimA: string;
  dimB: string;
  etapaOrdem: number | null;
  n: number;
}

function buildFromRows(rows: FlatRow[]): LostsData {
  const chart1_motivos: MotivoRow[] = [];
  const chart2_empreendimento: EmpreendRow[] = [];
  const chart3_canal: CanalRow[] = [];
  const chart4_etapa: EtapaRow[] = [];
  for (const r of rows) {
    if (r.chart === "c1") chart1_motivos.push({ mes: r.mes, motivo: r.dimA, n: r.n });
    else if (r.chart === "c3") chart3_canal.push({ mes: r.mes, canal: r.dimA, n: r.n });
    else if (r.chart === "c2")
      chart2_empreendimento.push({ mes: r.mes, empreendimento: r.dimA, motivo: r.dimB, n: r.n });
    else if (r.chart === "c4")
      chart4_etapa.push({
        mes: r.mes,
        etapa: r.dimA,
        etapaOrdem: r.etapaOrdem ?? 0,
        motivo: r.dimB,
        n: r.n,
      });
  }
  const meses = [...new Set(chart1_motivos.map((r) => r.mes))].sort();
  return {
    meta: { ...snapshot.meta, desde: meses[0] ?? snapshot.meta.desde, ate: meses[meses.length - 1] ?? snapshot.meta.ate, fonte: "Nekt (sync ao vivo) · pipeline 37, status=lost" },
    meses,
    chart1_motivos,
    chart2_empreendimento,
    chart3_canal,
    chart4_etapa,
  };
}

export async function getLostsData(): Promise<LostsData> {
  try {
    const rows = (await db.marketplaceLostAgg.findMany()) as FlatRow[];
    if (rows && rows.length > 0) return buildFromRows(rows);
  } catch {
    // tabela ainda não migrada / sync não configurado → usa snapshot
  }
  return snapshot;
}

// ─── Agregação por período (filtro por mês, base = data de perda) ─────────────
export interface StackRow {
  label: string;
  ordem: number;
  total: number;
  [serie: string]: number | string;
}
export interface Aggregated {
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

const OUTROS = "Outros";

function somaPorChave<T>(
  rows: T[],
  chave: (r: T) => string,
  valor: (r: T) => number
): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = chave(r);
    m.set(k, (m.get(k) ?? 0) + valor(r));
  }
  return m;
}

function topN(totais: Map<string, number>, n: number): string[] {
  return [...totais.entries()]
    .filter(([k]) => k !== OUTROS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

export function aggregate(data: LostsData, from: string, to: string): Aggregated {
  const dentro = (mes: string) => mes >= from && mes <= to;

  // Gráfico 1 — motivos
  const c1 = data.chart1_motivos.filter((r) => dentro(r.mes));
  const motivoTot = somaPorChave(c1, (r) => r.motivo, (r) => r.n);
  const total = [...motivoTot.values()].reduce((a, b) => a + b, 0);
  const motivos = [...motivoTot.entries()]
    .map(([motivo, n]) => ({ motivo, n, pct: total ? (n / total) * 100 : 0 }))
    .sort((a, b) => b.n - a.n);

  const trendMap = somaPorChave(c1, (r) => r.mes, (r) => r.n);
  const trend = [...trendMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, n]) => ({ mes, n }));

  // Gráfico 3 — canal
  const c3 = data.chart3_canal.filter((r) => dentro(r.mes));
  const canalTot = somaPorChave(c3, (r) => r.canal, (r) => r.n);
  const totalCanal = [...canalTot.values()].reduce((a, b) => a + b, 0);
  const ordemCanal = ["Midia Paga", "Base Interna", "Outros"];
  const canais = [...canalTot.entries()]
    .map(([canal, n]) => ({ canal, n, pct: totalCanal ? (n / totalCanal) * 100 : 0 }))
    .sort((a, b) => ordemCanal.indexOf(a.canal) - ordemCanal.indexOf(b.canal));

  // Gráfico 2 — motivo por empreendimento (3 motivos de maior volume)
  const c2 = data.chart2_empreendimento.filter((r) => dentro(r.mes));
  const motivosTop3 = topN(somaPorChave(c2, (r) => r.motivo, (r) => r.n), 3);
  const empMap = new Map<string, StackRow>();
  for (const r of c2) {
    if (!motivosTop3.includes(r.motivo)) continue;
    let row = empMap.get(r.empreendimento);
    if (!row) {
      row = { label: r.empreendimento, ordem: 0, total: 0 };
      for (const m of motivosTop3) row[m] = 0;
      empMap.set(r.empreendimento, row);
    }
    row[r.motivo] = (row[r.motivo] as number) + r.n;
    row.total += r.n;
  }
  const empreendimentos = [...empMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Gráfico 4 — motivo por etapa (ordem do funil)
  const c4 = data.chart4_etapa.filter((r) => dentro(r.mes));
  const top6 = topN(somaPorChave(c4, (r) => r.motivo, (r) => r.n), 6);
  const seriesEtapa = [...top6, OUTROS];
  const etapaMap = new Map<number, StackRow>();
  for (const r of c4) {
    let row = etapaMap.get(r.etapaOrdem);
    if (!row) {
      row = { label: r.etapa, ordem: r.etapaOrdem, total: 0 };
      for (const s of seriesEtapa) row[s] = 0;
      etapaMap.set(r.etapaOrdem, row);
    }
    const serie = top6.includes(r.motivo) ? r.motivo : OUTROS;
    row[serie] = (row[serie] as number) + r.n;
    row.total += r.n;
  }
  const etapas = [...etapaMap.values()].sort((a, b) => a.ordem - b.ordem);

  return { from, to, total, trend, motivos, canais, empreendimentos, motivosTop3, etapas, motivosEtapa: seriesEtapa };
}

export function defaultRange(meses: string[]): { from: string; to: string } {
  const to = meses[meses.length - 1];
  const from = meses[Math.max(0, meses.length - 6)];
  return { from, to };
}
