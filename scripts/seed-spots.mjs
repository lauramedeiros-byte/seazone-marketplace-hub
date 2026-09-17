// Popula SpotEmpreendimento com os 37 SPOTs de revenda (commercial_status = marketplace).
// Fonte: as 37 skills revendas-*-briefing. Seguro rodar de novo: usa upsert por slug.
// node --env-file=.env scripts/seed-spots.mjs
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "@prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const SPOTS = [
  [34, "Barra Grande Spot", "barra-grande-spot", "Maraú", "BA"],
  [24, "Barra Spot", "barra-spot", "Florianópolis", "SC"],
  [1, "Batel Spot", "batel-spot", "Curitiba", "PR"],
  [26, "Bonito Spot", "bonito-spot", "Bonito", "MS"],
  [2, "Cachoeira Beach Spot", "cachoeira-beach-spot", "Florianópolis", "SC"],
  [3, "Cachoeira Spot", "cachoeira-spot", "Florianópolis", "SC"],
  [17, "Campeche Spot", "campeche-spot", "Florianópolis", "SC"],
  [38, "Canas Beach Spot", "canas-beach-spot", "Florianópolis", "SC"],
  [5, "Canasvieiras Spot", "canasvieiras-spot", "Florianópolis", "SC"],
  [37, "Foz Spot", "foz-spot", "Foz do Iguaçu", "PR"],
  [29, "Ilha do Campeche II Spot", "ilha-do-campeche-ii-spot", "Florianópolis", "SC"],
  [6, "Ilha do Campeche Spot", "ilha-do-campeche-spot", "Florianópolis", "SC"],
  [7, "Imbassaí Spot", "imbassai-spot", "Mata de São João", "BA"],
  [8, "Ingleses Spot", "ingleses-spot", "Florianópolis", "SC"],
  [9, "Japaratinga Spot", "japaratinga-spot", "Japaratinga", "AL"],
  [10, "Jurerê Beach Spot", "jurere-beach-spot", "Florianópolis", "SC"],
  [44, "Jurerê Spot", "jurere-spot", "Florianópolis", "SC"],
  [31, "Jurerê Spot II", "jurere-spot-ii", "Florianópolis", "SC"],
  [11, "Lagoa Spot", "lagoa-spot", "Florianópolis", "SC"],
  [27, "Meireles Spot", "meireles-spot", "Fortaleza", "CE"],
  [12, "Morro das Pedras Spot", "morro-das-pedras-spot", "Florianópolis", "SC"],
  [41, "Natal Spot", "natal-spot", "Natal", "RN"],
  [40, "Novo Campeche Spot", "novo-campeche-spot", "Florianópolis", "SC"],
  [30, "Penha Spot", "penha-spot", "Penha", "SC"],
  [35, "Ponta das Canas Spot", "ponta-das-canas-spot", "Florianópolis", "SC"],
  [39, "Ponta das Canas Spot II", "ponta-das-canas-spot-ii", "Florianópolis", "SC"],
  [13, "Rosa Norte Spot", "rosa-norte-spot", "Imbituba", "SC"],
  [14, "Rosa Spot", "rosa-spot", "Imbituba", "SC"],
  [15, "Rosa Sul Spot", "rosa-sul-spot", "Imbituba", "SC"],
  [16, "Salvador Spot", "salvador-spot", "Salvador", "BA"],
  [25, "Santinho Spot", "santinho-spot", "Florianópolis", "SC"],
  [4, "Santo Antônio Spot", "santo-antonio-spot", "Florianópolis", "SC"],
  [18, "Sul da Ilha Spot", "sul-da-ilha-spot", "Florianópolis", "SC"],
  [19, "Trancoso Spot", "trancoso-spot", "Porto Seguro", "BA"],
  [20, "Urubici Spot", "urubici-spot", "Urubici", "SC"],
  [21, "Urubici Spot II", "urubici-spot-ii", "Urubici", "SC"],
  [22, "Vistas de Anita I", "vistas-de-anita-i", "Anitápolis", "SC"],
];

async function main() {
  let criados = 0, atualizados = 0;
  for (const [spotBuildingId, nome, slug, cidade, estado] of SPOTS) {
    const existe = await db.spotEmpreendimento.findUnique({ where: { slug } });
    await db.spotEmpreendimento.upsert({
      where: { slug },
      create: { spotBuildingId, nome, slug, cidade, estado },
      update: { spotBuildingId, nome, cidade, estado },
    });
    existe ? atualizados++ : criados++;
  }
  const total = await db.spotEmpreendimento.count();
  console.log(`${criados} criados, ${atualizados} atualizados. Total na tabela: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => pool.end());
