import { db } from "@/lib/db";
import { MetasClient } from "@/components/metas-client";

export const dynamic = "force-dynamic";

function getCurrentTrimestre() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month < 3) return `Q1-${year}`;
  if (month < 6) return `Q2-${year}`;
  if (month < 9) return `Q3-${year}`;
  return `Q4-${year}`;
}

async function getData(trimestre: string) {
  try {
    return await db.meta.findMany({
      where: { trimestre },
      orderBy: { criadoEm: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function MetasPage() {
  const trimestre = getCurrentTrimestre();
  const metas = await getData(trimestre);
  return <MetasClient initialMetas={metas} trimestreAtivo={trimestre} />;
}
