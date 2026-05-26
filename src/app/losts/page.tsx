import { db } from "@/lib/db";
import { LostsClient } from "@/components/losts-client";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    return await db.lostGrupo.findMany({
      orderBy: { criadoEm: "asc" },
      include: {
        Disparos: {
          orderBy: { criadoEm: "desc" },
          include: {
            historico: { orderBy: { dataEvento: "asc" } },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function LostsPage() {
  const grupos = await getData();
  return <LostsClient grupos={grupos} />;
}
