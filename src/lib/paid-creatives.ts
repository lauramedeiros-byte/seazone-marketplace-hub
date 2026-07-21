import snapshotRaw from "@/data/paid-creatives.json";
import { db } from "@/lib/db";

export interface Criativo {
  c: string; // nome do criativo (rd_campanha sem ID da plataforma)
  p: string; // plataforma: Meta | Google | Outros
  d: string | null; // data AAAA-MM-DD (última atividade)
  leads: number;
  sql: number; // cumulativo
  reuniao: number; // cumulativo
  contrato: number; // cumulativo
  won: number;
}
export interface CriativosData {
  meta: {
    pipelineId: number;
    funil: string;
    tipo: string;
    filtro: string;
    fonte: string;
    faixasSQL: string;
    snapshotAt?: string;
  };
  criativos: Criativo[];
}
export interface CriativosResult extends CriativosData {
  source: "nekt" | "snapshot";
  lastSync: string | null;
}

const snapshot = snapshotRaw as CriativosData;

export async function getCriativos(): Promise<CriativosResult> {
  try {
    const rows = (await db.paidCreative.findMany()) as unknown as {
      criativo: string;
      plataforma: string;
      dataCamp: string | null;
      leads: number;
      sql: number;
      reuniao: number;
      contrato: number;
      won: number;
      syncedAt: Date;
    }[];
    if (rows && rows.length > 0) {
      const criativos: Criativo[] = rows
        .map((r) => ({
          c: r.criativo,
          p: r.plataforma,
          d: r.dataCamp ?? null,
          leads: r.leads,
          sql: r.sql,
          reuniao: r.reuniao,
          contrato: r.contrato,
          won: r.won,
        }))
        .sort((a, b) => b.won - a.won || b.contrato - a.contrato || b.reuniao - a.reuniao || b.sql - a.sql || b.leads - a.leads);
      const lastSync = rows.map((r) => new Date(r.syncedAt).getTime()).reduce((mx, t) => (t > mx ? t : mx), 0);
      return {
        meta: { ...snapshot.meta, pipelineId: 37, funil: "Marketplace", fonte: "Nekt (sync automático) · p37" },
        criativos,
        source: "nekt",
        lastSync: lastSync ? new Date(lastSync).toISOString() : null,
      };
    }
  } catch {
    // tabela não migrada / sync não configurado → snapshot
  }
  return { ...snapshot, source: "snapshot", lastSync: null };
}
