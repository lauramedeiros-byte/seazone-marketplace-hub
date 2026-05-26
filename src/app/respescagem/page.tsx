import { db } from "@/lib/db";
import { RepescagemClient } from "@/components/repescagem-client";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    return await db.repescagemEmpreendimento.findMany({
      orderBy: { criadoEm: "asc" },
      include: { numeros: { orderBy: { criadoEm: "asc" } } },
    });
  } catch {
    return [];
  }
}

export default async function RepescagemPage() {
  const empreendimentos = await getData();
  return <RepescagemClient empreendimentos={empreendimentos} />;
}
