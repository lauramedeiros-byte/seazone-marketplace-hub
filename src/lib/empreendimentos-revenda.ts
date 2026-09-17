/**
 * Os empreendimentos de REVENDA (Marketplace) e a leitura do campo livre
 * `OppItem.nomeEmpreendimento`, onde o nome e a cota vêm grudados.
 *
 * Por que este arquivo existe:
 * - A tabela `Empreendimento` do banco mistura revenda com lançamento, tem
 *   duplicata de caixa ("FOZ SPOT" e "Foz Spot") e não tem Natal, Ponta das
 *   Canas II nem Vistas de Anitá. Não serve como fonte para o painel de opps.
 * - A lista abaixo é a das 37 skills `revendas-*-briefing`, que é o portfólio
 *   de revenda de verdade. Empreendimento novo de revenda → acrescente aqui.
 */

export const EMPREENDIMENTOS_REVENDA = [
  "Barra Grande Spot",
  "Barra Spot",
  "Batel Spot",
  "Bonito Spot",
  "Cachoeira Beach Spot",
  "Cachoeira Spot",
  "Campeche Spot",
  "Canas Beach Spot",
  "Canasvieiras Spot",
  "Foz Spot",
  "Ilha do Campeche II Spot",
  "Ilha do Campeche Spot",
  "Imbassaí Spot",
  "Ingleses Spot",
  "Japaratinga Spot",
  "Jurerê Beach Spot",
  "Jurerê Spot",
  "Jurerê Spot II",
  "Lagoa Spot",
  "Meireles Spot",
  "Morro das Pedras Spot",
  "Natal Spot",
  "Novo Campeche Spot",
  "Penha Spot",
  "Ponta das Canas Spot",
  "Ponta das Canas Spot II",
  "Rosa Norte Spot",
  "Rosa Spot",
  "Rosa Sul Spot",
  "Salvador Spot",
  "Santinho Spot",
  "Santo Antônio Spot",
  "Sul da Ilha Spot",
  "Trancoso Spot",
  "Urubici Spot",
  "Urubici Spot II",
  "Vistas de Anitá",
] as const;

/** Tira acento, caixa e a palavra SPOT — é o que casa "Jurerê Spot II" com "Jurerê Spot Ii". */
export function chaveEmpreendimento(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\bSPOT\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type NomeSeparado = {
  /** Nome do empreendimento como está na lista oficial, quando reconhecido. */
  empreendimento: string | null;
  /** Chave normalizada — use para comparar/agrupar. */
  chave: string;
  /** A cota/unidade, quando dá para identificar. */
  cota: string | null;
  /** O nome sem a cota, como veio escrito. Use quando `empreendimento` for null. */
  nomeLimpo: string;
};

const POR_CHAVE = new Map(
  EMPREENDIMENTOS_REVENDA.map((n) => [chaveEmpreendimento(n), n] as const)
);

/**
 * Separa "Santinho Spot | Unidade 514B*" em { Santinho Spot, 514B }.
 *
 * O campo é livre e chega em pelo menos seis formatos diferentes:
 *   "Natal Spot 1205" · "Natal SPOT, cota 103" · "Barra Grande Spot, 216"
 *   "Santinho Spot | Unidade 514B*" · "Rosa Norte Spot - 315"
 *   "Sul da Ilha Spot | SDI | 122 | 341.798,64 | 26,99% abaixo..." (colagem torta)
 */
export function separarNomeECota(raw: string): NomeSeparado {
  // anotações que a Laura escreveu no próprio nome
  const texto = raw.trim().replace(/\s*-\s*opp\s+semana\s+passada.*$/i, "");

  const partes = texto.split("|").map((p) => p.trim());
  let nome = partes[0];
  let cota: string | null = null;

  if (partes.length > 1) {
    const m = partes.slice(1).join(" ").match(/unidade\s+([0-9]+[A-Za-z]*)\*?/i);
    if (m) {
      cota = m[1];
    } else {
      // colagem torta: "| SIGLA | 122 | valor | ..." — a cota é o 3º campo
      const m2 = partes[2]?.match(/^([0-9]{2,4}[A-Za-z]*)$/);
      if (m2) cota = m2[1];
    }
  }

  if (cota) {
    nome = nome.replace(/,?\s*cota\s+[0-9]+[A-Za-z]*/i, "");
  } else {
    // cota grudada no nome, em ordem de confiança
    let m = nome.match(/,?\s*cota\s+([0-9]+[A-Za-z]*)/i);
    if (m) {
      cota = m[1];
      nome = nome.slice(0, m.index);
    } else {
      m = nome.match(/[,\-]\s*([0-9]{2,4}[A-Za-z]*)\s*$/);
      if (m) {
        cota = m[1];
        nome = nome.slice(0, m.index);
      } else {
        m = nome.match(/\s+([0-9]{2,4}[A-Za-z]*)\s*$/);
        if (m) {
          cota = m[1];
          nome = nome.slice(0, m.index);
        }
      }
    }
  }

  const chave = chaveEmpreendimento(nome);
  const nomeLimpo = nome.replace(/[,\-|]\s*$/, "").trim();
  return { empreendimento: POR_CHAVE.get(chave) ?? null, chave, cota, nomeLimpo };
}

/** Semanas inteiras entre duas segundas-feiras. */
export function semanasEntre(de: Date, ate: Date): number {
  return Math.round((ate.getTime() - de.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/** A partir de quantas semanas sem aparecer um empreendimento conta como "esfriando". */
export const SEMANAS_PARA_ESFRIAR = 4;
