// Mapas de SPOTs (Artefatos de consulta → Time comercial — Revendas).
// Parte fixa (nome, lugar, fotos, atrativos) em src/data/mapa-spots.json, gerada por
// projects/mapas-spots/motor/publicar-hub.py. Os números vêm ao vivo da Nekt.
import fixos from "@/data/mapa-spots.json";
import { queryNekt } from "@/lib/nekt";

type Preco = number | "consulte" | "vendido" | null;
type Status = "obra" | "planta" | "lancamento" | "entregue";

export interface SpotMapa {
  id: number;
  nome: string;
  cidade: string;
  uf: string;
  bairro: string;
  lat: number;
  lon: number;
  dif: string;
  fotos: string[];
  tags: string[][];
  perto: string[][];
  status: Status;
  ano: number | null;
  pct: number;
  preco: Preco;
  m2min: number | null;
  m2max: number | null;
}

// Novo Campeche Spot III: 100% vendido, revenda "em breve no marketplace" (decisão da Laura, 23/10/2026)
const VENDIDO = new Set([50]);

const IDS = fixos.map((s) => s.id).join(",");

// Preço, nesta ordem:
// 1. spotômetro — menor transfer_value das cotas disponíveis no marketplace;
// 2. lançamento — menor índice das unidades disponíveis × CUB mais recente do indexador do prédio
//    (é a mesma conta do "a partir de" do site; conferida em 26/10 contra 5 lançamentos, no centavo);
// 3. nenhuma cota disponível → "Sem oportunidades no momento"; senão → "Consulte".
const SQL = `
WITH latest AS (
  SELECT spot_building_unit_id, status,
         ROW_NUMBER() OVER (PARTITION BY spot_building_unit_id ORDER BY reference_date DESC, id DESC) rn
  FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_unit_marketplaces
), off AS (
  SELECT spot_building_unit_id, transfer_value,
         ROW_NUMBER() OVER (PARTITION BY spot_building_unit_id ORDER BY updated_at DESC, id DESC) rn
  FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_unit_marketplace_offers
), sp AS (
  SELECT u.spot_building_id sid, COUNT(*) disp, MIN(off.transfer_value) a_partir,
         MIN(u.total_area) m2min, MAX(u.total_area) m2max
  FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_units u
  JOIN latest l ON l.spot_building_unit_id = u.id AND l.rn = 1
  LEFT JOIN off ON off.spot_building_unit_id = u.id AND off.rn = 1
  WHERE l.status = 'disponivel' GROUP BY 1
), un AS (
  SELECT spot_building_id sid, COUNT(*) disp_lanc, MIN(total_area) m2min_l, MAX(total_area) m2max_l,
         MIN(CASE WHEN "index" > 0 THEN "index" END) idx_min
  FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_units
  WHERE status = 'disponivel' GROUP BY 1
), cub AS (
  SELECT indexer_id, amount,
         ROW_NUMBER() OVER (PARTITION BY indexer_id ORDER BY reference_date DESC) rn
  FROM nekt_operacional_bronze.sup_bd_szi_szi_indexer_quotations
)
SELECT b.id, b.building_status, b.commercial_status,
       sp.disp, sp.a_partir, sp.m2min, sp.m2max,
       un.disp_lanc, un.m2min_l, un.m2max_l, un.idx_min * cub.amount AS preco_lanc,
       d.construction_completion_pct AS pct,
       substr(cast(d.construction_delivery_date_actual AS varchar), 1, 10) AS entrega
FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_buildings b
LEFT JOIN nekt_operacional_bronze.sup_bd_szi_szi_spot_buildings_details d ON d.spot_building_id = b.id
LEFT JOIN sp ON sp.sid = b.id
LEFT JOIN un ON un.sid = b.id
LEFT JOIN cub ON cub.indexer_id = b.indexer_id AND cub.rn = 1
WHERE b.id IN (${IDS})
`;

const num = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// building_status do SZI → as 4 fases do mapa (mesma leitura do mapa de 23/10)
function fase(building: string | null, comercial: string | null, reserva: Status): Status {
  const b = (building ?? "").toLowerCase();
  if (b === "entregue") return "entregue";
  if (b === "obra") return "obra";
  if (b.startsWith("lan") || (comercial ?? "").toLowerCase().startsWith("comercializ")) return "lancamento";
  if (b.startsWith("aprova")) return "planta";
  return reserva;
}

const somenteReserva = (): SpotMapa[] =>
  fixos.map(({ reserva, ...f }) => ({ ...f, ...reserva, status: reserva.status as Status, preco: reserva.preco as Preco }));

export async function carregarSpots(): Promise<{ spots: SpotMapa[]; aoVivo: boolean; erro?: string }> {
  let rows;
  try {
    ({ rows } = await queryNekt(SQL));
  } catch (e) {
    return { spots: somenteReserva(), aoVivo: false, erro: e instanceof Error ? e.message : String(e) };
  }
  const porId = new Map(rows.map((r) => [Number(r.id), r]));

  const spots = fixos.map(({ reserva, ...f }): SpotMapa => {
    const r = porId.get(f.id);
    const base: SpotMapa = { ...f, ...reserva, status: reserva.status as Status, preco: reserva.preco as Preco };
    if (!r) return base;

    const status = fase(r.building_status as string | null, r.commercial_status as string | null, base.status);
    const disp = num(r.disp) ?? 0;
    const dispLanc = num(r.disp_lanc) ?? 0;
    const aPartir = num(r.a_partir);
    const precoLanc = num(r.preco_lanc);

    let preco: Preco;
    if (VENDIDO.has(f.id)) preco = "vendido";
    else if (aPartir) preco = Math.round(aPartir * 100) / 100;
    else if (precoLanc) preco = Math.round(precoLanc * 100) / 100;
    else if (!disp && !dispLanc) preco = null;
    else preco = "consulte";

    const m2min = num(r.m2min) ?? num(r.m2min_l) ?? base.m2min;
    const m2max = num(r.m2max) ?? num(r.m2max_l) ?? base.m2max;

    // Entregue mantém o ano de entrega já conferido (o SZI traz data futura em alguns entregues)
    const anoNekt = num(String(r.entrega ?? "").slice(0, 4));
    const ano = status === "entregue" && base.status === "entregue" ? base.ano : anoNekt ?? base.ano;

    const pct = status === "obra" ? num(r.pct) ?? 0 : status === "entregue" ? 100 : 0;

    return { ...base, status, preco, m2min, m2max, ano, pct };
  });

  return { spots, aoVivo: true };
}
