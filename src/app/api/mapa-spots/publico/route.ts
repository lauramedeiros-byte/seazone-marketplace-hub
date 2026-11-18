import { NextResponse } from "next/server";
import { carregarSpots } from "@/lib/mapa-spots";

// Versão aberta (sem login) dos números dos mapas, usada pela página pública /spots.
// Mesmos dados da /api/mapa-spots, mas a resposta fica guardada 5 min na CDN: muita gente
// abrindo o link não vira uma consulta à Nekt por visita.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const { spots, aoVivo, copia, erro } = await carregarSpots();
  if (erro) console.error("[mapa-spots/publico] Nekt falhou, usando números de 23/10:", erro);
  const fmt = (d: Date) => d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const horario = fmt(new Date());
  const atualizado = copia ? fmt(new Date(copia)) : null;
  return NextResponse.json(
    { spots, aoVivo, horario, atualizado },
    {
      headers: {
        // se a Nekt falhou, não guarda a reserva de 23/10 por 5 min
        "Cache-Control": aoVivo
          ? "public, s-maxage=300, stale-while-revalidate=600"
          : "no-store",
      },
    }
  );
}
