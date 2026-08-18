import { NextResponse } from "next/server";
import { aggregate, defaultRange, getLostsData } from "@/lib/losts-marketplace";

// Fonte: tabela sincronizada da Nekt (marketplace_lost) com fallback para o
// snapshot versionado. Ver docs/sync-losts-marketplace.md.
// Filtro por intervalo de datas exatas (?from=AAAA-MM-DD&to=AAAA-MM-DD).
export async function GET(request: Request) {
  try {
    const data = await getLostsData();
    const def = defaultRange(data);
    const { searchParams } = new URL(request.url);

    const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    let from = isDate(searchParams.get("from")) ? searchParams.get("from")! : def.from;
    let to = isDate(searchParams.get("to")) ? searchParams.get("to")! : def.to;
    if (from < data.minDate) from = data.minDate;
    if (to > data.maxDate) to = data.maxDate;
    if (from > to) [from, to] = [to, from];

    const result = aggregate(data, from, to);
    return NextResponse.json({
      meta: data.meta,
      source: data.source,
      lastSync: data.lastSync,
      minDate: data.minDate,
      maxDate: data.maxDate,
      ...result,
    });
  } catch (error) {
    console.error("Erro ao agregar losts marketplace:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
