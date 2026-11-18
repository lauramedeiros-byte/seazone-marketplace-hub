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
  // SPOT em obra: fotos de obra do mês mais recente do informativo, já colocadas em fotos[1..n]
  obra?: { mes: string; n: number; minis: string[] };
}

// Novo Campeche Spot III: 100% vendido, revenda "em breve no marketplace" (decisão da Laura, 23/10/2026)
const VENDIDO = new Set([50]);

// Fotos de obra por SPOT no carrossel: as primeiras do mês mais recente, na ordem do informativo.
const FOTOS_OBRA = 4;

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
), pub AS (
  -- % da obra = a do informativo (spotsys → PMO → Informativos): último mês PUBLICADO e o
  -- "Avanço Físico Geral" da medição daquele mês (ou do mês anterior mais perto). Mesma regra da tela.
  SELECT spot_building_id sid, MAX(date_format(reference_month, '%Y-%m')) mes
  FROM nekt_operacional_bronze.sup_bd_szi_szi_informative_publications
  WHERE published_at IS NOT NULL GROUP BY 1
), adv AS (
  SELECT spot_building_id sid, date_format(reference_date, '%Y-%m') m, overall_physical_construction_percentage p,
         ROW_NUMBER() OVER (PARTITION BY spot_building_id, date_format(reference_date, '%Y-%m') ORDER BY updated_at DESC, id DESC) rn
  FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_construction_advancement_timelines
), inf AS (
  SELECT pub.sid, adv.p, ROW_NUMBER() OVER (PARTITION BY pub.sid ORDER BY adv.m DESC) rn
  FROM pub JOIN adv ON adv.sid = pub.sid AND adv.rn = 1 AND adv.m <= pub.mes AND adv.p IS NOT NULL
)
SELECT b.id, b.building_status, b.commercial_status,
       sp.disp, sp.a_partir, sp.m2min, sp.m2max,
       un.disp_lanc, un.m2min_l, un.m2max_l, un.idx_min * cub.amount AS preco_lanc,
       inf.p AS pct_informativo, d.construction_completion_pct AS pct_szi,
       substr(cast(d.construction_delivery_date_actual AS varchar), 1, 10) AS entrega,
       (SELECT MAX(_nekt_sync_at) FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_unit_marketplaces) AS copia
FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_buildings b
LEFT JOIN nekt_operacional_bronze.sup_bd_szi_szi_spot_buildings_details d ON d.spot_building_id = b.id
LEFT JOIN sp ON sp.sid = b.id
LEFT JOIN un ON un.sid = b.id
LEFT JOIN cub ON cub.indexer_id = b.indexer_id AND cub.rn = 1
LEFT JOIN inf ON inf.sid = b.id AND inf.rn = 1
WHERE b.id IN (${IDS})
`;

// Fotos de obra do informativo (mesma tabela da tela de informativos do spotsys).
// reference_month vem como "10/2026" (as novas) ou "Out/2026" (as importadas); "Atual" = foto de entregue.
const SQL_FOTOS = `
WITH c AS (
  SELECT spot_building_id sid, image_url u, sort_order so, id,
         CASE WHEN regexp_like(reference_month, '^\\d{2}/\\d{4}$')
                THEN concat(substr(reference_month, 4, 4), '-', substr(reference_month, 1, 2))
              WHEN regexp_like(reference_month, '^[A-Za-z]{3}/\\d{4}$')
                THEN concat(substr(reference_month, 5, 4), '-',
                     lpad(cast((strpos('JanFevMarAbrMaiJunJulAgoSetOutNovDez', substr(reference_month, 1, 3)) + 2) / 3 AS varchar), 2, '0'))
         END ym
  FROM nekt_operacional_bronze.sup_bd_szi_szi_spot_building_construction_images
  WHERE spot_building_id IN (${IDS}) AND image_url LIKE 'https://%'
), m AS (SELECT sid, MAX(ym) ym FROM c WHERE ym IS NOT NULL GROUP BY 1)
SELECT c.sid, c.ym, c.u, ROW_NUMBER() OVER (PARTITION BY c.sid ORDER BY c.so, c.id) ordem
FROM c JOIN m ON m.sid = c.sid AND m.ym = c.ym
`;

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const SUPA = "/storage/v1/object/public/";
// Foto grande (~250 KB em vez de 3 MB) e miniatura, sem cortar a foto.
function tamanho(u: string, px: number): string {
  if (u.includes(SUPA)) {
    return u.replace(SUPA, "/storage/v1/render/image/public/") +
      `?width=${px}&height=${px}&resize=${px < 400 ? "cover" : "contain"}&quality=${px < 400 ? 60 : 75}`;
  }
  if (u.includes("drive.google.com/thumbnail")) return u.replace(/&sz=[^&]*/, "") + `&sz=w${px}`;
  return u;
}

async function fotosDeObra(): Promise<Map<number, { mes: string; grandes: string[]; minis: string[] }>> {
  const { rows } = await queryNekt(SQL_FOTOS);
  const porSpot = new Map<number, { mes: string; grandes: string[]; minis: string[] }>();
  // não repete foto que já está fixa no carrossel do SPOT (mesmo arquivo); outro ângulo entra normal
  const arquivo = (u: string) => u.split("?")[0].split("/").pop() ?? u;
  const jaTem = new Map(fixos.map((s) => [s.id, new Set((s.origens ?? []).map(arquivo))]));
  rows
    .sort((a, b) => Number(a.ordem) - Number(b.ordem))
    .forEach((r) => {
      const id = Number(r.sid);
      if (jaTem.get(id)?.has(arquivo(String(r.u)))) return;
      const [ano, mes] = String(r.ym).split("-");
      const item = porSpot.get(id) ?? { mes: `${MESES[Number(mes) - 1]}/${ano}`, grandes: [], minis: [] };
      if (item.grandes.length < FOTOS_OBRA) {
        item.grandes.push(tamanho(String(r.u), 1400));
        item.minis.push(tamanho(String(r.u), 240));
      }
      porSpot.set(id, item);
    });
  return porSpot;
}

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- origens é só para o servidor
  fixos.map(({ reserva, origens: _o, ...f }) => ({ ...f, ...reserva, status: reserva.status as Status, preco: reserva.preco as Preco }));

// Hora em que a Nekt copiou o spotômetro pela última vez (a cópia roda várias vezes ao dia).
// O mapa consulta a Nekt toda vez que abre; o número é o desta cópia, não o do segundo exato.
export async function carregarSpots(): Promise<{ spots: SpotMapa[]; aoVivo: boolean; copia?: number | null; erro?: string }> {
  let rows;
  // fotos de obra são extra: se a consulta delas falhar, o mapa abre igual, só sem elas
  const obraP = fotosDeObra().catch((e) => {
    console.error("[mapa-spots] fotos de obra indisponíveis:", e);
    return new Map<number, { mes: string; grandes: string[]; minis: string[] }>();
  });
  try {
    ({ rows } = await queryNekt(SQL));
  } catch (e) {
    return { spots: somenteReserva(), aoVivo: false, erro: e instanceof Error ? e.message : String(e) };
  }
  const obraFotos = await obraP;
  const porId = new Map(rows.map((r) => [Number(r.id), r]));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- origens é só para o servidor
  const spots = fixos.map(({ reserva, origens: _o, ...f }): SpotMapa => {
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

    // % da obra: a do informativo; sem informativo publicado, a do SZI
    const pct = status === "obra" ? num(r.pct_informativo) ?? num(r.pct_szi) ?? 0 : status === "entregue" ? 100 : 0;

    // Em obra: fotos de obra do mês mais recente logo depois da capa
    const of = status === "obra" ? obraFotos.get(f.id) : undefined;
    if (of && of.grandes.length) {
      const fotos = [base.fotos[0], ...of.grandes, ...base.fotos.slice(1)];
      return { ...base, status, preco, m2min, m2max, ano, pct, fotos, obra: { mes: of.mes, n: of.grandes.length, minis: of.minis } };
    }
    return { ...base, status, preco, m2min, m2max, ano, pct };
  });

  const copia = num(rows[0]?.copia as string | number | null);
  return { spots, aoVivo: true, copia: copia ? copia * 1000 : null };
}
