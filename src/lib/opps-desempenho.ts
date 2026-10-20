/**
 * Aba "Desempenho" de /opps-da-semana: liga cada opp registrada às campanhas do motor
 * que a levaram ao ar e calcula os números. Os dados das campanhas e das cotas vêm do
 * cron /api/cron/sync-opps-desempenho (Nekt → OppDesempenho / OppCotaStatus).
 *
 * Como a ligação é feita (não há id em comum entre opp e campanha):
 * - o SPOT da campanha sai do nome (`..._MKTPL_<SPOT>_CAMPAIGN`) e é comparado pela
 *   chaveEmpreendimento() com o nome da opp;
 * - a data tem que cair perto da semana de PUBLICAÇÃO da opp. Até 28/09/2026 o registro
 *   usava a semana da escolha (publicação = semana seguinte); a partir de 05/10/2026,
 *   a própria semana de publicação. Os registros antigos não foram reescritos.
 */
import { chaveEmpreendimento, separarNomeECota } from "@/lib/empreendimentos-revenda";

const DIA = 24 * 60 * 60 * 1000;
/** Primeira semana registrada pela semana de publicação (e não pela de escolha). */
const INICIO_REGISTRO_POR_PUBLICACAO = Date.UTC(2026, 9, 5);
/** Antes disso as opps saíam pela MIA, que não está no motor. */
export const INICIO_DADOS_MOTOR = "2026-08-01";
/** Janela para contar a cota como vendida "depois da opp". */
export const DIAS_VENDA = 30;

export function spotDaCampanha(nome: string): string {
  const m = nome.toUpperCase().match(/MKTPL_(.+?)_CAMPAIGN_?$/);
  return m ? chaveEmpreendimento(m[1].replace(/_/g, " ")) : "";
}

export function toqueDaCampanha(nome: string): "1T" | "2T" {
  return /(^|_)(2T|2_?TOQUE|2ºT)(_|$)/i.test(nome) ? "2T" : "1T";
}

/** "R$ 302.000,00" · "250.000,00" · "R$ 529 mil" → número em reais. */
export function lerPreco(preco: string | null): number | null {
  if (!preco) return null;
  const t = preco.toLowerCase();
  const mil = /mil/.test(t);
  const limpo = t.replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(limpo);
  if (!isFinite(n) || n <= 0) return null;
  return mil ? n * 1000 : n;
}

/**
 * Preço da opp. Nas semanas de 03 e 10/08/2026 a colagem gravou a ENTRADA no campo `preco`
 * e o preço de verdade ficou no nome ("Ingleses Spot | ING | 414 | 330.000,00 | ...").
 * Quando o nome traz um valor em reais, ele manda.
 */
export function precoDoItem(nomeEmpreendimento: string, preco: string | null): number | null {
  const doNome = nomeEmpreendimento.match(/\|\s*(\d{3}\.\d{3},\d{2})\s*\|/);
  return lerPreco(doNome ? doNome[1] : preco);
}

export interface CampanhaDesempenho {
  campanha: string;
  dataCamp: string;
  spotChave: string;
  toque: string;
  envios: number;
  levantadas: number;
  agendou: number;
  reuniao: number;
  contrato: number;
}

export interface CotaStatus {
  spotChave: string;
  cota: string;
  statusAtual: string | null;
  primeiraVendaEm: string | null;
  primeiraReservaEm: string | null;
}

export interface ItemSemana {
  id: string;
  nomeEmpreendimento: string;
  cota: string | null;
  preco: string | null;
  destaque: boolean;
  tipoDestaque: string | null;
  weekStart: Date;
}

export type Venda = "vendida" | "vendida-antes" | "reservada" | "disponivel" | "sem-dado";

export interface OppComResultado {
  id: string;
  nome: string;
  chave: string;
  cota: string | null;
  preco: number | null;
  dono: "mkt" | "monica";
  publicacao: string; // YYYY-MM-DD (segunda da semana em que foi ao ar)
  campanhas: CampanhaDesempenho[];
  envios: number;
  levantadas: number;
  agendou: number;
  reuniao: number;
  contrato: number;
  venda: Venda;
  vendaEm: string | null;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const porMil = (n: number, base: number) => (base > 0 ? (1000 * n) / base : 0);

export function semanaDePublicacao(weekStart: Date): Date {
  return weekStart.getTime() >= INICIO_REGISTRO_POR_PUBLICACAO ? weekStart : new Date(weekStart.getTime() + 7 * DIA);
}

function statusDeVenda(s: CotaStatus | undefined, publicacao: Date): { venda: Venda; vendaEm: string | null } {
  if (!s) return { venda: "sem-dado", vendaEm: null };
  const ini = publicacao.getTime();
  const fim = ini + DIAS_VENDA * DIA;
  if (s.primeiraVendaEm) {
    const t = Date.parse(s.primeiraVendaEm + "T00:00:00Z");
    if (t < ini - 3 * DIA) return { venda: "vendida-antes", vendaEm: s.primeiraVendaEm };
    if (t <= fim) return { venda: "vendida", vendaEm: s.primeiraVendaEm };
  }
  if (s.primeiraReservaEm) {
    const t = Date.parse(s.primeiraReservaEm + "T00:00:00Z");
    if (t >= ini - 3 * DIA && t <= fim) return { venda: "reservada", vendaEm: s.primeiraReservaEm };
  }
  return { venda: s.statusAtual === "disponivel" ? "disponivel" : "sem-dado", vendaEm: null };
}

export function montarDesempenho(itens: ItemSemana[], campanhas: CampanhaDesempenho[], cotas: CotaStatus[]) {
  const statusPorCota = new Map(cotas.map((c) => [`${c.spotChave}|${c.cota.toUpperCase()}`, c]));

  const opps = itens
    .filter((i) => i.destaque || i.tipoDestaque === "monica")
    .map((i) => {
      const lido = separarNomeECota(i.nomeEmpreendimento);
      const cota = (i.cota ?? lido.cota)?.trim().toUpperCase() ?? null;
      const pub = semanaDePublicacao(i.weekStart);
      return {
        item: i,
        lido,
        cota,
        pub,
        dono: (i.tipoDestaque === "monica" ? "monica" : "mkt") as "mkt" | "monica",
      };
    });

  // cada campanha vai para a opp de marketing do mesmo SPOT com publicação mais próxima
  // (janela: 3 dias antes a 11 dias depois da segunda de publicação)
  const ligadas = new Map<string, CampanhaDesempenho[]>();
  const semOpp: CampanhaDesempenho[] = [];
  for (const c of campanhas) {
    const t = Date.parse(c.dataCamp + "T00:00:00Z");
    let melhor: { id: string; dist: number } | null = null;
    for (const o of opps) {
      if (o.dono !== "mkt" || o.lido.chave !== c.spotChave) continue;
      const delta = (t - o.pub.getTime()) / DIA;
      if (delta < -3 || delta > 11) continue;
      if (!melhor || Math.abs(delta) < melhor.dist) melhor = { id: o.item.id, dist: Math.abs(delta) };
    }
    if (melhor) ligadas.set(melhor.id, [...(ligadas.get(melhor.id) ?? []), c]);
    else semOpp.push(c);
  }

  const resultado: OppComResultado[] = opps.map((o) => {
    const cs = (ligadas.get(o.item.id) ?? []).sort((a, b) => a.dataCamp.localeCompare(b.dataCamp));
    const soma = (k: "envios" | "levantadas" | "agendou" | "reuniao" | "contrato") => cs.reduce((s, c) => s + c[k], 0);
    const v = statusDeVenda(o.cota ? statusPorCota.get(`${o.lido.chave}|${o.cota}`) : undefined, o.pub);
    return {
      id: o.item.id,
      nome: o.lido.empreendimento ?? o.lido.nomeLimpo,
      chave: o.lido.chave,
      cota: o.cota,
      preco: precoDoItem(o.item.nomeEmpreendimento, o.item.preco),
      dono: o.dono,
      publicacao: iso(o.pub),
      campanhas: cs,
      envios: soma("envios"),
      levantadas: soma("levantadas"),
      agendou: soma("agendou"),
      reuniao: soma("reuniao"),
      contrato: soma("contrato"),
      ...v,
    };
  });

  const mktComDados = resultado.filter((o) => o.dono === "mkt" && o.envios > 0);

  const total = campanhas.reduce(
    (s, c) => ({
      envios: s.envios + c.envios,
      levantadas: s.levantadas + c.levantadas,
      agendou: s.agendou + c.agendou,
      reuniao: s.reuniao + c.reuniao,
      contrato: s.contrato + c.contrato,
    }),
    { envios: 0, levantadas: 0, agendou: 0, reuniao: 0, contrato: 0 }
  );

  const porToque = (["1T", "2T"] as const).map((t) => {
    const cs = campanhas.filter((c) => c.toque === t);
    const envios = cs.reduce((s, c) => s + c.envios, 0);
    const levantadas = cs.reduce((s, c) => s + c.levantadas, 0);
    const reuniao = cs.reduce((s, c) => s + c.reuniao, 0);
    return { toque: t, campanhas: cs.length, envios, levantadas, reuniao, levMil: porMil(levantadas, envios), reunMil: porMil(reuniao, envios) };
  });

  const FAIXAS = [
    { rotulo: "até R$ 250 mil", min: 0, max: 250000 },
    { rotulo: "R$ 250–380 mil", min: 250000, max: 380000 },
    { rotulo: "R$ 380–450 mil", min: 380000, max: 450000 },
    { rotulo: "acima de R$ 450 mil", min: 450000, max: Infinity },
  ];
  const porFaixa = FAIXAS.map((f) => {
    const os = mktComDados.filter((o) => o.preco !== null && o.preco >= f.min && o.preco < f.max);
    const envios = os.reduce((s, o) => s + o.envios, 0);
    const reuniao = os.reduce((s, o) => s + o.reuniao, 0);
    const levantadas = os.reduce((s, o) => s + o.levantadas, 0);
    return { faixa: f.rotulo, opps: os.length, envios, levantadas, reuniao, levMil: porMil(levantadas, envios), reunMil: porMil(reuniao, envios) };
  });

  const ranking = [...mktComDados]
    .filter((o) => o.envios >= 300)
    .sort((a, b) => porMil(b.reuniao, b.envios) - porMil(a.reuniao, a.envios) || porMil(b.levantadas, b.envios) - porMil(a.levantadas, a.envios));

  const vendidas = resultado.filter((o) => o.venda === "vendida");

  return {
    opps: resultado.sort((a, b) => b.publicacao.localeCompare(a.publicacao) || a.dono.localeCompare(b.dono)),
    total: { ...total, levMil: porMil(total.levantadas, total.envios), reunMil: porMil(total.reuniao, total.envios), campanhas: campanhas.length },
    porToque,
    porFaixa,
    ranking,
    vendidas,
    semOpp: semOpp.sort((a, b) => b.dataCamp.localeCompare(a.dataCamp)),
  };
}

export type Desempenho = ReturnType<typeof montarDesempenho>;
export { porMil };
