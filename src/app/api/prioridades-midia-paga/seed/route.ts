import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Lista de empreendimentos com SPOT
    const nomes = [
      "URUBICI II SPOT",
      "MEIRELES SPOT",
      "BATEL SPOT",
      "SANTO ANTONIO SPOT",
      "JURERÊ BEACH SPOT",
      "SUL DA ILHA SPOT",
      "CACHOEIRA SPOT",
      "ILHA DO CAMPECHE SPOT",
      "ILHA DO CAMPECHE II SPOT",
      "JAPARATINGA SPOT",
      "INGLESES SPOT",
      "ROSA SPOT",
      "PENHA SPOT",
      "LAGOA SPOT",
      "MORRO DAS PEDRAS SPOT",
      "ROSA NORTE SPOT",
      "CANASVIEIRAS SPOT",
      "CAMPECHE SPOT",
      "SALVADOR SPOT",
      "TRANCOSO SPOT",
      "IMBASSAÍ SPOT",
      "URUBICI SPOT",
      "ROSA SUL SPOT",
      "BARRA SPOT",
      "JURERÊ SPOT",
      "CACHOEIRA BEACH SPOT",
      "BONITO SPOT",
      "SANTINHO SPOT",
      "PONTA DAS CANAS SPOT",
      "FOZ SPOT",
      "CANAS BEACH SPOT",
      "NOVO CAMPECHE SPOT",
      "JURERE II SPOT",
      "BONITO II SPOT",
      "MARISTA 144 SPOT",
      "CARAGUA SPOT",
      "ITACARÉ SPOT",
      "BARRA GRANDE SPOT",
    ];

    let created = 0;
    let skipped = 0;

    for (const nome of nomes) {
      try {
        await db.empreendimento.create({ data: { nome } });
        created++;
      } catch (e) {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: `Created ${created} empreendimentos, ${skipped} already existed`
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar empreendimentos" }, { status: 500 });
  }
}