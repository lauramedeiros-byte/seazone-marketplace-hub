/**
 * Leitura do texto colado das opps da semana.
 *
 * Por que existe: o campo chegava desconfigurado porque o único parser tolerante
 * (linha a linha, por palavra-chave) chutava o nome do empreendimento a partir da
 * frase inteira. O resultado ia para o banco como
 * "Sul da Ilha Spot | SDI | 122 | 341.798,64 | 26,99% abaixo do valor..." no campo
 * do NOME. Aqui a leitura é explícita e, quando não é, a página mostra o que
 * entendeu antes de gravar.
 *
 * Três formatos, nesta ordem:
 *   1. "padrao" — rótulos explícitos. É o formato oficial, não tem como quebrar.
 *   2. "rico"   — os blocos "Oportunidade — ..." que o Marketplace manda.
 *   3. "livre"  — última tentativa, uma opp por linha. Sempre marcado como incerto.
 */

import { separarNomeECota } from "./empreendimentos-revenda";

export type FormatoLido = "padrao" | "rico" | "livre";

export interface OppLida {
  nome: string;
  cota: string | null;
  preco: string | null;
  localizacao: string | null;
  condicoes: string;
  /** O texto original do bloco, guardado inteiro para consulta. */
  observacoes: string;
  /** true quando o nome bate com um dos 37 empreendimentos de revenda. */
  reconhecido: boolean;
}

/** O que cada leitor devolve, antes da normalização final. */
type OppBruta = Omit<OppLida, "reconhecido">;

export interface LeituraOpps {
  opps: OppLida[];
  formato: FormatoLido;
  /** true quando a leitura é chute e merece conferência na tela. */
  incerto: boolean;
}

/** O modelo que a página oferece para copiar. */
export const FORMATO_MODELO = `Empreendimento: Santinho Spot
Cota: 408B
Valor: R$ 306.000,00
Diferenciais: 31,76% abaixo do mercado · Entrada em 6x · Entrega jan/2030
---
Empreendimento: Foz Spot
Cota: 708
Valor: R$ 301.427,13
Diferenciais: 20,61% abaixo do mercado · Entrada em 10x · Entrega mai/2030`;

const ROTULOS: { campo: keyof OppLida; re: RegExp }[] = [
  { campo: "nome", re: /^(?:empreendimento|empreend|spot)\s*[:\-]\s*(.*)$/i },
  { campo: "cota", re: /^(?:cota|unidade|und?)\s*[:\-]\s*(.*)$/i },
  { campo: "preco", re: /^(?:valor(?:\s+da\s+cota)?|pre[çc]o)\s*[:\-]\s*(.*)$/i },
  { campo: "localizacao", re: /^(?:local|localiza[çc][ãa]o|endere[çc]o|bairro)\s*[:\-]\s*(.*)$/i },
  {
    campo: "condicoes",
    re: /^(?:diferenciais|diferencial|benef[íi]cios?|condi[çc][õo]es)\s*[:\-]\s*(.*)$/i,
  },
];

function limpaEmoji(s: string): string {
  return s
    .replace(/:[a-z0-9_+\-]+:/gi, " ")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Quebra o texto nos separadores `---`, ou em cada "Empreendimento:" quando não houver. */
function blocosPadrao(texto: string): string[] {
  const porTraco = texto
    .split(/^\s*-{3,}\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);
  const temRotuloNome = (b: string) => /^(?:empreendimento|empreend|spot)\s*[:\-]/im.test(b);

  if (porTraco.length > 1 && porTraco.every(temRotuloNome)) return porTraco;

  // sem `---`: corta antes de cada "Empreendimento:"
  const porRotulo = texto
    .split(/(?=^(?:empreendimento|empreend|spot)\s*[:\-])/im)
    .map((b) => b.trim())
    .filter(temRotuloNome);
  if (porRotulo.length) return porRotulo;

  return porTraco.filter(temRotuloNome);
}

function lerBlocoPadrao(bloco: string): OppBruta | null {
  const campos: Record<string, string> = {};
  const sobra: string[] = [];

  for (const linhaBruta of bloco.split("\n")) {
    const linha = limpaEmoji(linhaBruta);
    if (!linha) continue;
    const achou = ROTULOS.find((r) => r.re.test(linha));
    if (achou) {
      const valor = linha.match(achou.re)?.[1]?.trim() ?? "";
      if (valor) campos[achou.campo] = valor;
    } else {
      sobra.push(linha);
    }
  }

  if (!campos.nome) return null;

  // linhas sem rótulo viram diferenciais, para nada se perder
  const condicoes = [campos.condicoes, ...sobra].filter(Boolean).join(" · ");

  return {
    nome: campos.nome.slice(0, 160),
    cota: campos.cota ?? null,
    preco: campos.preco ?? null,
    localizacao: campos.localizacao ?? null,
    condicoes,
    observacoes: bloco.trim(),
  };
}

// ── Formato "rico": blocos "Oportunidade — ..." ────────────────────────────
function blocosRicos(texto: string): string[] {
  return texto
    .split(/(?=(?::fire:\s*)?Oportunidade\s*[—–-]\s)/i)
    .map((p) => p.replace(/\n\s*-{3,}\s*\n?/g, "\n").trim())
    .filter((p) => /Oportunidade\s*[—–-]/i.test(p));
}

function lerBlocoRico(bruto: string): OppBruta | null {
  const original = bruto.trim();
  const linhas = original.split("\n").map((l) => l.trim()).filter(Boolean);
  let nome = "";
  let preco: string | null = null;
  let localizacao: string | null = null;
  const cond: string[] = [];
  const push = (v: string) => {
    const t = v.trim();
    if (!t || t.length <= 1) return;
    if (/^Unidade\s+\S+$/i.test(t)) return;
    if (!cond.includes(t)) cond.push(t);
  };

  for (const linha of linhas) {
    const limpa = limpaEmoji(linha);
    if (!limpa) continue;

    const cab = limpa.match(/Oportunidade\s*[—–-]\s*(.+)/i);
    if (cab) {
      nome = cab[1].trim();
      continue;
    }

    if (/moneybag/i.test(linha) || (!preco && /^R\$/.test(limpa))) {
      const m = limpa.match(/R\$\s*[\d.]+(?:,\d{2})?/);
      if (m) preco = m[0].replace(/\s+/g, " ").trim();
      const partes = limpa.split("|").map((x) => x.trim());
      for (let i = 1; i < partes.length; i++) push(partes[i]);
      continue;
    }

    // a linha do alfinete é a cidade/UF — vai para o campo próprio, não para os diferenciais
    const temAlfinete = /round_pushpin/i.test(linha) || /\u{1F4CD}/u.test(linha);
    if (!localizacao && temAlfinete && /\/[A-Za-z]{2}\b/.test(limpa)) {
      localizacao = limpa;
      continue;
    }

    for (const parte of limpa.split("|")) push(parte);
  }

  if (!nome) return null;

  // no formato rico a cota vem junto do nome ("Santinho Spot | Unidade 514B*")
  let cota: string | null = null;
  const mCota = nome.match(/(?:unidade|cota)\s+([0-9]+[A-Za-z]*)\*?/i);
  if (mCota) {
    cota = mCota[1];
    nome = nome.replace(/\s*\|?\s*(?:unidade|cota)\s+[0-9]+[A-Za-z]*\*?/i, "").trim();
  }
  nome = nome.replace(/\s*\|\s*$/, "").trim();

  return {
    nome: nome.slice(0, 160),
    cota,
    preco,
    localizacao,
    condicoes: cond.join(" · "),
    observacoes: original,
  };
}

// ── Última tentativa: uma opp por linha ────────────────────────────────────
function lerLinhaLivre(linha: string): OppBruta | null {
  const texto = linha.trim();
  if (texto.length < 3) return null;

  const mPreco = texto.match(/R\$\s*[\d.]+(?:,\d{2})?/);
  const preco = mPreco ? mPreco[0] : null;

  const campos = texto.split(/[|;·]/).map((x) => x.trim());
  let cota: string | null = null;

  // colagem com sigla: "Sul da Ilha Spot | SDI | 122 | 341.798,64 | ..."
  if (campos.length >= 3 && /^[0-9]{2,4}[A-Za-z]?$/.test(campos[2])) {
    cota = campos[2];
  }

  // o nome é o que vem antes do primeiro separador forte, já sem o preço
  let nome = campos[0]
    .replace(/R\$\s*[\d.]+(?:,\d{2})?/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cota) {
    const mCota = nome.match(/(?:,?\s*(?:cota|unidade)\s+|[,\-]\s*|\s+)([0-9]{2,4}[A-Za-z]*)\s*$/i);
    if (mCota) {
      cota = mCota[1];
      nome = nome.slice(0, mCota.index).trim();
    }
  } else {
    nome = nome.replace(/,?\s*(?:cota|unidade)\s+[0-9]+[A-Za-z]*/i, "").trim();
  }
  nome = nome.replace(/[,\-|]\s*$/, "").trim();
  if (nome.length < 3) return null;

  const condicoes = campos
    .slice(1)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ");

  return { nome: nome.slice(0, 160), cota, preco, localizacao: null, condicoes, observacoes: texto };
}

/**
 * Passo final, igual para os três formatos: confere o nome contra a lista dos 37
 * e resgata a cota que tenha ficado grudada nele.
 *
 * Existe porque o mesmo empreendimento chega escrito de jeitos diferentes
 * ("Natal SPOT, cota 103") e, gravado como veio, não agrupa com os outros depois.
 * A grafia oficial entra aqui, na hora de gravar, e não na hora de exibir.
 */
function normalizar(o: OppBruta): OppLida {
  const lido = separarNomeECota(o.nome);
  return {
    ...o,
    nome: lido.empreendimento ?? lido.nomeLimpo ?? o.nome,
    cota: o.cota ?? lido.cota,
    reconhecido: lido.empreendimento !== null,
  };
}

/** Lê o texto colado e devolve as opps + qual formato reconheceu. */
export function lerOpps(texto: string): LeituraOpps {
  const limpo = texto.trim();
  if (!limpo) return { opps: [], formato: "livre", incerto: true };

  const padrao = blocosPadrao(limpo)
    .map(lerBlocoPadrao)
    .filter((o): o is OppBruta => o !== null);
  if (padrao.length) return { opps: padrao.map(normalizar), formato: "padrao", incerto: false };

  const ricos = blocosRicos(limpo)
    .map(lerBlocoRico)
    .filter((o): o is OppBruta => o !== null);
  if (ricos.length) return { opps: ricos.map(normalizar), formato: "rico", incerto: false };

  const livres = limpo
    .split("\n")
    .map(lerLinhaLivre)
    .filter((o): o is OppBruta => o !== null);
  return { opps: livres.map(normalizar), formato: "livre", incerto: true };
}
