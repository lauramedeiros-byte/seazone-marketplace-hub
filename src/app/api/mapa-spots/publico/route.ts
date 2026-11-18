import { NextResponse } from "next/server";
import { carregarSpots } from "@/lib/mapa-spots";
import { queryNekt } from "@/lib/nekt";

// Big number "cotas comercializadas": cotas com status vendida no SZI (todos os SPOTs).
const SQL_VENDIDAS = `SELECT COUNT(*) n FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_units WHERE status = 'vendida'`;

async function contarVendidas(): Promise<number | null> {
  try {
    const { rows } = await queryNekt(SQL_VENDIDAS);
    const n = Number(rows[0]?.n);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (e) {
    console.error("[mapa-spots/publico] cotas vendidas falhou:", e);
    return null;
  }
}

// Versão aberta (sem login) dos números dos mapas, usada pela página pública /spots.
// Mesmos dados da /api/mapa-spots, mas a resposta fica guardada 5 min na CDN: muita gente
// abrindo o link não vira uma consulta à Nekt por visita.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const [{ spots, aoVivo, copia, erro }, vendidas] = await Promise.all([carregarSpots(), contarVendidas()]);
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
    { spots, aoVivo, horario, atualizado, vendidas },
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
