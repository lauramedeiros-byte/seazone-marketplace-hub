// Script para popular empreendimentos no banco
import { db } from "@/lib/db";

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

async function seed() {
  console.log("Iniciando seed de empreendimentos...");
  let created = 0;
  let skipped = 0;

  for (const nome of nomes) {
    try {
      await db.empreendimento.create({ data: { nome } });
      created++;
      console.log(`✓ ${nome}`);
    } catch (e) {
      skipped++;
      console.log(`- ${nome} (já existe)`);
    }
  }

  console.log(`\nConcluído: ${created} criados, ${skipped} ignorados (já existiam)`);
}

seed().catch(console.error);