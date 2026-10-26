import { NextResponse } from "next/server";
import { carregarSpots } from "@/lib/mapa-spots";

// Números dos mapas de SPOTs: busca na Nekt a cada abertura do mapa (sem cópia guardada).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const { spots, aoVivo, copia, erro } = await carregarSpots();
  if (erro) console.error("[mapa-spots] Nekt falhou, usando números de 23/10:", erro);
  const fmt = (d: Date) => d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const horario = fmt(new Date());
  // hora da última cópia do spotômetro na Nekt (a fonte dos números)
  const atualizado = copia ? fmt(new Date(copia)) : null;
  return NextResponse.json(
    { spots, aoVivo, horario, atualizado },
    { headers: { "Cache-Control": "no-store" } }
  );
}
