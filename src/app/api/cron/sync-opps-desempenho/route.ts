import { NextResponse } from "next/server";
import { queryNekt } from "@/lib/nekt";
import { db } from "@/lib/db";
import { chaveEmpreendimento, separarNomeECota } from "@/lib/empreendimentos-revenda";
import { spotDaCampanha, toqueDaCampanha } from "@/lib/opps-desempenho";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Nekt às 7h pode demorar; mesmo teto do sync-losts

// Sync da aba "Desempenho" de /opps-da-semana (Vercel Cron diário, ver vercel.json).
// 1) resultado de cada campanha de opp da semana no motor (SIA), desde 01/08/2026 —
//    antes disso as opps saíam pela MIA, que não está no motor;
// 2) status de venda das cotas que já apareceram em opp da semana (TODAS as datas de venda
//    e de reserva, para a página olhar só o que aconteceu depois da opp);
// 3) catálogo vivo de empreendimentos com cota em revenda.
// Regras de contagem: as mesmas do agente de propostas (projects/disparos, queries/6):
// levantada = clique positivo sem botão de saída (piso, a recusa não grava desde ~17/09);
// reunião = etapas 8–12 e contrato = 13+, por acúmulo (maior entre histórico e etapa de hoje),
// ligando envio → deal pelo telefone (o vínculo do motor quebrou em 13/09).

const SQL_CAMPANHAS = String.raw`
WITH camp AS (
  SELECT c.id, c.nome
  FROM "nekt_operacional_bronze"."supabase_motor_campanha" c
  WHERE regexp_like(c.nome, 'OPP_?[12]?_?(DA_)?SEMANA|OP_2_SEMANA|OPORTUNIDADE[_-]DA[_-]SEMANA')
    AND c.nome NOT LIKE '%HOSPEDE%'
    AND replace(regexp_extract(c.nome, '^([0-9]{4}[_-][0-9]{2}[_-][0-9]{2})', 1), '_', '-') >= '2026-08-01'
), disp AS (
  SELECT d.campanha_id, d.sai_session_id sid, d.enviado_at, d.lead_telefone tel
  FROM "nekt_operacional_bronze"."supabase_motor_disparo" d JOIN camp c ON c.id = d.campanha_id
  WHERE d.enviado_at IS NOT NULL AND d.lead_vertical = 'MKP'
), env AS (SELECT campanha_id, count(*) enviados FROM disp GROUP BY 1),
resp AS (
  SELECT di.campanha_id, di.sid, di.enviado_at, di.tel,
    upper(array_join(array_agg(cast(m.content AS varchar) ORDER BY m.created_at), ' || ')) f
  FROM disp di JOIN "nekt_operacional_bronze"."postgres_public_chat_message" m
    ON m.session_id = di.sid AND m.role = 'user' AND m.created_at >= di.enviado_at AND m.created_at >= timestamp '2026-08-01 00:00:00'
  WHERE di.sid IS NOT NULL GROUP BY 1,2,3,4
), lev AS (
  SELECT r.*, substr(regexp_replace(regexp_replace(tel,'\D',''),'^55(?=\d{10,11}$)',''),1,2) || substr(regexp_replace(tel,'\D',''),-8) k
  FROM resp r
  WHERE NOT regexp_like(f, 'N[ÃA]O TENHO INTERESSE|AINDA N[ÃA]O [ÉE] O MOMENTO|N[ÃA]O [ÉE] O MOMENTO|N[ÃA]O SOU INVESTIDOR')
    AND regexp_like(f, 'QUERO SABER MAI|QUERO MAIS DETALHES|QUERO DETALHES|FALAR COM (UM |O )?ESPECIALISTA|^ *TENHO INTERESSE|QUERO RETOMAR|PREFIRO OUTRO DESTINO')
), ph AS (
  SELECT DISTINCT p.id person_id,
    substr(regexp_replace(regexp_replace(cast(x.r.value AS varchar),'\D',''),'^55(?=\d{10,11}$)',''),1,2) ||
    substr(regexp_replace(cast(x.r.value AS varchar),'\D',''),-8) k
  FROM "nekt_operacional_bronze"."pipedrive_persons" p CROSS JOIN UNNEST(p.phones) AS x(r)
), stg AS (SELECT id, order_nr FROM "nekt_operacional_bronze"."pipedrive_stages" WHERE pipeline_id = 37),
dl AS (
  SELECT l.sid, l.campanha_id, l.enviado_at, d.id did, d.add_time, d.status dst, s.order_nr cur_ord
  FROM lev l JOIN ph ON ph.k = l.k
  JOIN "nekt_operacional_bronze"."pipedrive_deals" d ON d.person_id = ph.person_id AND d.pipeline_id = 37
  LEFT JOIN stg s ON s.id = d.stage_id
), fl AS (
  SELECT dl.sid, dl.did, max(stg.order_nr) mx
  FROM dl JOIN "nekt_operacional_bronze"."pipedrive_deal_flow" f ON f.item_id = dl.did AND f.field_key = 'stage_id'
  JOIN stg ON cast(stg.id AS varchar) = f.new_value
  WHERE f.log_time >= dl.enviado_at GROUP BY 1,2
), porlead AS (
  SELECT dl.sid, dl.campanha_id,
    max(GREATEST(coalesce(fl.mx,0), CASE WHEN dl.add_time >= dl.enviado_at THEN coalesce(dl.cur_ord,0) ELSE 0 END)) max_pos,
    max(CASE WHEN dl.dst = 'won' AND dl.add_time >= dl.enviado_at THEN 1 ELSE 0 END) won_novo
  FROM dl LEFT JOIN fl ON fl.sid = dl.sid AND fl.did = dl.did GROUP BY 1,2
)
SELECT c.nome campanha, coalesce(e.enviados,0) envios,
  (SELECT count(*) FROM lev WHERE lev.campanha_id = c.id) levantadas,
  (SELECT count(*) FROM porlead p WHERE p.campanha_id = c.id AND p.max_pos >= 6) agendou,
  (SELECT count(*) FROM porlead p WHERE p.campanha_id = c.id AND p.max_pos BETWEEN 8 AND 12) reuniao,
  (SELECT count(*) FROM porlead p WHERE p.campanha_id = c.id AND (p.max_pos >= 13 OR p.won_novo = 1)) contrato
FROM camp c LEFT JOIN env e ON e.campanha_id = c.id
WHERE coalesce(e.enviados,0) > 0`;

function sqlStatusCotas(codigos: string[]): string {
  const lista = codigos.map((c) => `'${c.replace(/'/g, "")}'`).join(",");
  return String.raw`
SELECT b.short_name spot, u.code cota,
  max_by(m.status, m.reference_date) status_atual,
  array_join(array_sort(array_distinct(array_agg(CASE WHEN m.status = 'vendida' THEN date_format(m.reference_date, '%Y-%m-%d') END))), ',') vendas,
  array_join(array_sort(array_distinct(array_agg(CASE WHEN m.status IN ('negociacao','contrato','bloqueada') THEN date_format(m.reference_date, '%Y-%m-%d') END))), ',') reservas
FROM "nekt_operacional_bronze"."sup_bd_szi_szi_spot_building_unit_marketplaces" m
JOIN "nekt_operacional_bronze"."sup_bd_szi_szi_spot_building_units" u ON u.id = m.spot_building_unit_id
JOIN "nekt_operacional_bronze"."sup_bd_szi_szi_spot_buildings" b ON b.id = u.spot_building_id
WHERE upper(u.code) IN (${lista})
GROUP BY 1, 2`;
}

const SQL_CATALOGO = String.raw`
WITH latest AS (
  SELECT spot_building_unit_id, status, ROW_NUMBER() OVER (PARTITION BY spot_building_unit_id ORDER BY reference_date DESC, id DESC) rn
  FROM "nekt_operacional_bronze"."sup_bd_szi_szi_spot_building_unit_marketplaces"
)
SELECT b.short_name spot, count(*) disponiveis
FROM latest l
JOIN "nekt_operacional_bronze"."sup_bd_szi_szi_spot_building_units" u ON u.id = l.spot_building_unit_id
JOIN "nekt_operacional_bronze"."sup_bd_szi_szi_spot_buildings" b ON b.id = u.spot_building_id
WHERE l.rn = 1 AND l.status = 'disponivel'
GROUP BY 1`;

const num = (v: unknown) => Number(v) || 0;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    // cotas que já apareceram em opp da semana (campo próprio ou lida do nome)
    const itens = await db.oppItem.findMany({ select: { nomeEmpreendimento: true, cota: true } });
    const codigos = new Set<string>();
    for (const i of itens) {
      const cota = (i.cota ?? separarNomeECota(i.nomeEmpreendimento).cota)?.trim().toUpperCase();
      if (cota && /^[0-9A-Z]{1,6}$/.test(cota)) codigos.add(cota);
    }

    const [camps, cotas, catalogo] = await Promise.all([
      queryNekt(SQL_CAMPANHAS),
      codigos.size ? queryNekt(sqlStatusCotas([...codigos])) : Promise.resolve({ columns: [], rows: [] }),
      queryNekt(SQL_CATALOGO),
    ]);

    // campanha com vários lotes (mesmo nome, campanha_id diferentes) vira uma linha só
    type Linha = { campanha: string; dataCamp: string; spotChave: string; toque: string; envios: number; levantadas: number; agendou: number; reuniao: number; contrato: number };
    const porNome = new Map<string, Linha>();
    for (const d of camps.rows
      .map((r) => {
        const campanha = String(r.campanha ?? "").trim();
        return {
          campanha,
          dataCamp: (campanha.match(/^(\d{4})[_-](\d{2})[_-](\d{2})/) ?? []).slice(1).join("-"),
          spotChave: spotDaCampanha(campanha),
          toque: toqueDaCampanha(campanha),
          envios: num(r.envios),
          levantadas: num(r.levantadas),
          agendou: num(r.agendou),
          reuniao: num(r.reuniao),
          contrato: num(r.contrato),
        };
      })
      .filter((d) => d.campanha && d.dataCamp && d.spotChave)) {
      const a = porNome.get(d.campanha);
      if (!a) porNome.set(d.campanha, d);
      else for (const k of ["envios", "levantadas", "agendou", "reuniao", "contrato"] as const) a[k] += d[k];
    }
    const desempenho = [...porNome.values()];

    if (desempenho.length === 0) {
      return NextResponse.json({ ok: false, error: "Nekt retornou 0 campanhas — mantendo dados anteriores" }, { status: 502 });
    }

    const statusCotas = cotas.rows.map((r) => ({
      spotChave: chaveEmpreendimento(String(r.spot ?? "")),
      cota: String(r.cota ?? "").trim().toUpperCase(),
      statusAtual: r.status_atual ? String(r.status_atual) : null,
      primeiraVendaEm: r.vendas ? String(r.vendas) : null,
      primeiraReservaEm: r.reservas ? String(r.reservas) : null,
    }));

    // catálogo: empreendimento que aparece pela 1ª vez ganha a data de hoje;
    // no 1º sync de todos, os que já existiam ficam com 2000-01-01 (não são "novos").
    // Mesma chave vinda de dois nomes: fica a última linha (como antes, quando o 2º update vencia).
    const primeiroSync = (await db.revendaEmpreendimento.count()) === 0;
    const porChave = new Map<string, { chave: string; nome: string; disp: number }>();
    for (const r of catalogo.rows) {
      const nome = String(r.spot ?? "").trim();
      if (nome) porChave.set(chaveEmpreendimento(nome), { chave: chaveEmpreendimento(nome), nome, disp: num(r.disponiveis) });
    }
    const catalogoLinhas = [...porChave.values()];
    // hora UTC sem fuso, como o Prisma grava nas colunas "timestamp without time zone"
    const primeiraVez = primeiroSync ? "2000-01-01 00:00:00" : new Date().toISOString().replace("T", " ").slice(0, 23);

    // Tudo-ou-nada, em 5 comandos (antes eram ~41: um update por empreendimento). A Vercel
    // roda em iad1 (Washington) e o banco fica em São Paulo: cada ida e volta custa ~120 ms,
    // e os ~41 comandos estouravam o timeout padrão de 5s da transação do Prisma. O sync
    // ficou parado de 20/10 a 10/11/2026 sem ninguém ver (mesma história do sync-losts, 30/09).
    await db.$transaction(
      [
        db.oppDesempenho.deleteMany(),
        db.oppDesempenho.createMany({ data: desempenho }),
        ...(statusCotas.length ? [db.oppCotaStatus.deleteMany(), db.oppCotaStatus.createMany({ data: statusCotas, skipDuplicates: true })] : []),
        ...(catalogoLinhas.length
          ? [
              // upsert num INSERT só: quem já existe mantém a "primeiraVez" e só atualiza nome e contagem
              db.$executeRaw`
                INSERT INTO "RevendaEmpreendimento" ("chave", "nome", "cotasDisponiveis", "primeiraVez", "atualizadoEm")
                SELECT c.chave, c.nome, c.disp, ${primeiraVez}::timestamp(3), (now() AT TIME ZONE 'UTC')
                FROM unnest(
                  ${catalogoLinhas.map((c) => c.chave)}::text[],
                  ${catalogoLinhas.map((c) => c.nome)}::text[],
                  ${catalogoLinhas.map((c) => c.disp)}::int[]
                ) AS c(chave, nome, disp)
                ON CONFLICT ("chave") DO UPDATE
                  SET "nome" = EXCLUDED."nome",
                      "cotasDisponiveis" = EXCLUDED."cotasDisponiveis",
                      "atualizadoEm" = EXCLUDED."atualizadoEm"`,
            ]
          : []),
      ],
      { timeout: 120_000, maxWait: 10_000 }
    );

    return NextResponse.json({
      ok: true,
      campanhas: desempenho.length,
      cotas: statusCotas.length,
      empreendimentos: catalogoLinhas.length,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("sync-opps-desempenho falhou:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
