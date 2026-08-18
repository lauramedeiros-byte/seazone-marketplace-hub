import snapshotRaw from "@/data/disparos-marketplace.json";
import { db } from "@/lib/db";

export interface Campanha {
  c: string; // nome da campanha (rd_campanha)
  d: string | null; // data AAAA-MM-DD (do nome), quando houver
  leads: number;
  sql: number; // chegou à faixa Contatados→Reunião Agendada
  fup: number; // Reunião Realizada concluída (>= FUP) ou won
  contrato: number;
  won: number;
}
export interface DisparosData {
  meta: {
    pipelineId: number;
    funil: string;
    tipo: string;
    filtro: string;
    fonte: string;
    faixasSQL: string;
    criterioData: string;
    snapshotAt?: string;
  };
  campaigns: Campanha[];
}
export interface DisparosResult extends DisparosData {
  source: "nekt" | "snapshot";
  lastSync: string | null; // ISO — última atualização vinda do sync
}

const snapshot = snapshotRaw as DisparosData;

// Fonte: tabela sincronizada da Nekt (marketplace_disparo); fallback = snapshot.
export async function getDisparos(): Promise<DisparosResult> {
  try {
    const rows = (await db.marketplaceDisparo.findMany()) as unknown as {
      campanha: string;
      dataCamp: string | null;
      leads: number;
      sql: number;
      fup: number;
      contrato: number;
      won: number;
      syncedAt: Date;
    }[];
    if (rows && rows.length > 0) {
      const campaigns: Campanha[] = rows
        .map((r) => ({
          c: r.campanha,
          d: r.dataCamp ?? null,
          leads: r.leads,
          sql: r.sql,
          fup: r.fup,
          contrato: r.contrato,
          won: r.won,
        }))
        .sort((a, b) => b.won - a.won || b.contrato - a.contrato || b.fup - a.fup || b.sql - a.sql || b.leads - a.leads);
      const lastSync = rows
        .map((r) => new Date(r.syncedAt).getTime())
        .reduce((mx, t) => (t > mx ? t : mx), 0);
      return {
        meta: { ...snapshot.meta, fonte: "Nekt (sync automático) · p37" },
        campaigns,
        source: "nekt",
        lastSync: lastSync ? new Date(lastSync).toISOString() : null,
      };
    }
  } catch {
    // tabela não migrada / sync não configurado → snapshot
  }
  return { ...snapshot, source: "snapshot", lastSync: null };
}

// Peso por etapa alcançada (termômetro): WON >> Contrato > Reunião/FUP > SQL.
export const PESOS = { won: 15, contrato: 8, fup: 4, sql: 1 };
export function scoreDe(c: Pick<Campanha, "won" | "contrato" | "fup" | "sql">): number {
  return c.won * PESOS.won + c.contrato * PESOS.contrato + c.fup * PESOS.fup + c.sql * PESOS.sql;
}
