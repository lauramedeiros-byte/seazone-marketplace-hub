import { NextResponse } from "next/server";
import { getCriativos } from "@/lib/paid-creatives";

// Criativos de mídia paga (p37 Marketplace). Filtros/ordenação no cliente.
export async function GET() {
  try {
    const data = await getCriativos();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao carregar criativos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
