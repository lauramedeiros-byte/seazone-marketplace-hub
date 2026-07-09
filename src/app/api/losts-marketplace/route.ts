import { NextResponse } from "next/server";
import { aggregate, defaultRange, getLostsData } from "@/lib/losts-marketplace";

// Fonte: tabela sincronizada da Nekt (marketplace_lost_agg) com fallback para o
// snapshot versionado. Ver docs/sync-losts-marketplace.md para configurar o sync.
export async function GET(request: Request) {
  try {
    const data = await getLostsData();
    const meses = data.meses;
    const min = meses[0];
    const max = meses[meses.length - 1];
    const def = defaultRange(meses);

    const { searchParams } = new URL(request.url);
    let from = searchParams.get("from") || def.from;
    let to = searchParams.get("to") || def.to;
    if (from < min) from = min;
    if (to > max) to = max;
    if (from > to) [from, to] = [to, from];

    const result = aggregate(data, from, to);
    return NextResponse.json({ meta: data.meta, mesesDisponiveis: meses, ...result });
  } catch (error) {
    console.error("Erro ao agregar losts marketplace:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
