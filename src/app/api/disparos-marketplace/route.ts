import { NextResponse } from "next/server";
import { getDisparos } from "@/lib/disparos-marketplace";

// Retorna as campanhas de disparo da base interna (p37). O filtro por data e o
// cálculo de termômetro/padrões são feitos no cliente (dataset pequeno).
export async function GET() {
  try {
    const data = await getDisparos();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao carregar disparos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
