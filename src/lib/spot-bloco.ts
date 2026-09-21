/**
 * O "bloco do hub": o formato único de copiar-e-colar dos briefings e roteiros de SPOT.
 *
 * O texto que a skill entrega vem com um cabeçalho entre duas linhas de `---`, no formato
 * `chave: valor | nota`, e o markdown do conteúdo logo abaixo. O cabeçalho é o que permite
 * montar a capa, os números em destaque e a lista de fontes clicáveis — em vez de jogar
 * tudo num muro de markdown.
 *
 * Nada aqui é obrigatório: texto colado sem cabeçalho continua funcionando e cai no
 * caminho antigo (só o corpo). É o que mantém abrindo os briefings subidos antes de
 * 21/09/2026.
 */

export type ValorComNota = { valor: string; nota: string | null };
export type LinkNomeado = { titulo: string; url: string };

export type BlocoSpot = {
  /** true quando o texto colado trazia o cabeçalho entre `---`. */
  temCabecalho: boolean;
  tipo: "briefing" | "roteiro" | null;
  campos: Record<string, ValorComNota>;
  links: LinkNomeado[];
  fontes: LinkNomeado[];
  corpo: string;
};

/** Apelidos aceitos no cabeçalho — o nome da direita é o que o app usa. */
const APELIDOS: Record<string, string> = {
  spot: "spot",
  empreendimento: "spot",
  slug: "spot",
  tipo: "tipo",
  geradoem: "geradoEm",
  data: "geradoEm",
  geradopor: "geradoPor",
  autor: "geradoPor",
  origem: "origem",
  artefato: "artefatoUrl",
  artefatourl: "artefatoUrl",
  docs: "docsUrl",
  docsurl: "docsUrl",
  observacao: "observacao",
  obs: "observacao",
  // capa
  fase: "fase",
  entrega: "entrega",
  alvara: "alvara",
  cronograma: "cronograma",
  // números
  roi: "roi",
  roipct: "roi",
  faturamento: "faturamento",
  faturamentoano: "faturamento",
  valorizacao: "valorizacao",
  valorizacaopct: "valorizacao",
  apartirde: "aPartirDe",
  ticketmedio: "ticketMedio",
  ticket: "ticketMedio",
  cotas: "cotas",
  cotasdisponiveis: "cotas",
  posicaocidade: "posicaoCidade",
  posicaoportfolio: "posicaoPortfolio",
  // roteiro
  formato: "formato",
  status: "status",
  codigo: "codigo",
  duracao: "duracao",
  monica: "monica",
  tese: "estrutura",
  estrutura: "estrutura",
  oquemuda: "oQueMuda",
  derivadode: "derivadoDe",
  // listas
  link: "link",
  fonte: "fonte",
  anexo: "anexo",
};

const LISTAS = new Set(["link", "fonte", "anexo"]);

/** Acentos fora, minúsculas, só letra e número: "Gerado Em" e "geradoem" caem no mesmo lugar. */
function semAcento(valor: string): string {
  return valor.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizarChave(bruta: string): string | null {
  const limpa = semAcento(bruta.trim().toLowerCase()).replace(/[^a-z0-9]/g, "");
  return APELIDOS[limpa] ?? null;
}

/** `Nome do lugar | https://...` — a URL é a parte que parece URL, venha em que posição vier. */
function partirLink(valor: string): LinkNomeado | null {
  const partes = valor.split("|").map((p) => p.trim()).filter(Boolean);
  if (partes.length === 0) return null;
  const iUrl = partes.findIndex((p) => /^https?:\/\//i.test(p));
  if (iUrl === -1) return null;
  const url = partes[iUrl];
  const titulo =
    partes.filter((_, i) => i !== iUrl).join(" — ") ||
    url.replace(/^https?:\/\//, "").split("/")[0];
  return { titulo, url };
}

export function parseBloco(texto: string): BlocoSpot {
  const semCabecalho: BlocoSpot = {
    temCabecalho: false,
    tipo: null,
    campos: {},
    links: [],
    fontes: [],
    corpo: (texto ?? "").trim(),
  };
  if (!texto || !texto.trim()) return semCabecalho;

  const linhas = texto.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < linhas.length && !linhas[i].trim()) i++;
  if (linhas[i]?.trim() !== "---") return semCabecalho;

  const inicio = i + 1;
  let fim = -1;
  for (let j = inicio; j < linhas.length; j++) {
    if (linhas[j].trim() === "---") {
      fim = j;
      break;
    }
  }
  // cabeçalho aberto e nunca fechado: trata o texto inteiro como conteúdo comum
  if (fim === -1) return semCabecalho;

  const campos: Record<string, ValorComNota> = {};
  const links: LinkNomeado[] = [];
  const fontes: LinkNomeado[] = [];

  for (const linha of linhas.slice(inicio, fim)) {
    if (!linha.trim() || linha.trim().startsWith("#")) continue;
    const corte = linha.indexOf(":");
    if (corte === -1) continue;
    const chave = normalizarChave(linha.slice(0, corte));
    const bruto = linha.slice(corte + 1).trim();
    if (!chave || !bruto) continue;

    if (LISTAS.has(chave)) {
      const item = partirLink(bruto);
      if (!item) continue;
      if (chave === "fonte") fontes.push(item);
      else links.push(item);
      continue;
    }

    const partes = bruto.split("|").map((p) => p.trim());
    campos[chave] = { valor: partes[0], nota: partes.slice(1).join(" · ") || null };
  }

  const tipoBruto = campos.tipo?.valor?.toLowerCase();
  return {
    temCabecalho: true,
    tipo: tipoBruto === "roteiro" ? "roteiro" : tipoBruto === "briefing" ? "briefing" : null,
    campos,
    links,
    fontes,
    corpo: linhas.slice(fim + 1).join("\n").trim(),
  };
}

/** "R$ 67.817,63" → 67817.63 · "22,12%" → 22.12 · "5º de 20" → 5 */
export function numeroPtBr(valor: string | undefined): number | null {
  if (!valor) return null;
  const limpo = valor.replace(/[^\d.,-]/g, "");
  if (!limpo || !/\d/.test(limpo)) return null;
  const n = Number(limpo.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** O `resumoJson` que já era gravado no banco, agora derivado do cabeçalho. */
export function resumoDoBloco(bloco: BlocoSpot): Record<string, unknown> | undefined {
  const c = bloco.campos;
  const resumo: Record<string, unknown> = {};
  const numericos: [string, string | undefined][] = [
    ["roiPct", c.roi?.valor],
    ["faturamentoLiquidoAno", c.faturamento?.valor],
    ["valorizacaoPct", c.valorizacao?.valor],
    ["aPartirDe", c.aPartirDe?.valor],
    ["ticketMedio", c.ticketMedio?.valor],
    ["cotasDisponiveis", c.cotas?.valor],
  ];
  for (const [chave, bruto] of numericos) {
    const n = numeroPtBr(bruto);
    if (n !== null) resumo[chave] = n;
  }
  if (c.posicaoCidade?.valor) resumo.posicaoCidade = c.posicaoCidade.valor;
  if (c.posicaoPortfolio?.valor) resumo.posicaoPortfolio = c.posicaoPortfolio.valor;
  if (c.fase?.valor) resumo.fase = c.fase.valor;
  if (c.entrega?.valor) resumo.entrega = c.entrega.valor;
  if (bloco.fontes.length) resumo.fontes = bloco.fontes;
  return Object.keys(resumo).length ? resumo : undefined;
}

/** Data solta ("17/09/2026" ou "2026-09-17") → ISO curto, para o campo do formulário. */
export function dataParaIso(valor: string | undefined): string | null {
  if (!valor) return null;
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = valor.match(/^\d{4}-\d{2}-\d{2}/);
  return iso ? iso[0] : null;
}

const FORMATOS_VALIDOS = ["video-narrado", "video-apresentadora", "estatico"];

/** Aceita "vídeo narrado", "narrado", "estático" e devolve o valor que o banco guarda. */
export function normalizarFormato(valor: string | undefined): string | null {
  if (!valor) return null;
  const limpo = semAcento(valor.toLowerCase()).replace(/[^a-z]/g, "");
  const direto = FORMATOS_VALIDOS.find((f) => f.replace(/-/g, "") === limpo);
  if (direto) return direto;
  if (limpo.includes("apresentadora")) return "video-apresentadora";
  if (limpo.includes("narrado")) return "video-narrado";
  if (limpo.includes("estatico")) return "estatico";
  return null;
}

export function normalizarStatus(valor: string | undefined): string | null {
  if (!valor) return null;
  const limpo = valor.toLowerCase();
  if (limpo.startsWith("produzid")) return "produzido";
  if (limpo.startsWith("aprovad")) return "aprovado";
  if (limpo.startsWith("teste")) return "teste";
  return null;
}

export function ehSim(valor: string | undefined): boolean {
  if (!valor) return false;
  return /^(sim|s|true|1|com)\b/i.test(valor.trim());
}

/* ------------------------------------------------------------------ *
 * Recorte do markdown — onde começa e termina cada pedaço do conteúdo.
 * Fica aqui, longe do React, para poder ser conferido com o texto real
 * de um briefing.
 * ------------------------------------------------------------------ */

export type BlocoMd =
  | { tipo: "md"; texto: string }
  | { tipo: "ficha"; linhas: [string, string][] };

const SO_BARRAS = /^\s*\|(\s*\|)+\s*$/;
const SEPARADOR = /^\s*\|[\s:-]*\|[\s:|-]*$/;

function celulas(linha: string): string[] {
  return linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

/**
 * Separa o markdown em pedaços, isolando as tabelas de duas colunas sem cabeçalho
 * (`| | |`) — que viram ficha rótulo/valor em vez de tabela com uma faixa vazia em cima.
 */
export function partirEmBlocos(md: string): BlocoMd[] {
  const linhas = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocos: BlocoMd[] = [];
  let buffer: string[] = [];

  const despejar = () => {
    const texto = buffer.join("\n").trim();
    if (texto) blocos.push({ tipo: "md", texto });
    buffer = [];
  };

  for (let i = 0; i < linhas.length; i++) {
    const ehFicha =
      SO_BARRAS.test(linhas[i]) &&
      celulas(linhas[i]).length === 2 &&
      SEPARADOR.test(linhas[i + 1] ?? "") &&
      celulas(linhas[i + 1] ?? "").length === 2;

    if (!ehFicha) {
      buffer.push(linhas[i]);
      continue;
    }

    despejar();
    const rotuloValor: [string, string][] = [];
    let j = i + 2;
    while (j < linhas.length && linhas[j].trim().startsWith("|")) {
      const cols = celulas(linhas[j]);
      if (cols.length >= 2) rotuloValor.push([cols[0], cols.slice(1).join(" · ")]);
      j++;
    }
    if (rotuloValor.length) blocos.push({ tipo: "ficha", linhas: rotuloValor });
    i = j - 1;
  }

  despejar();
  return blocos;
}

export type SecaoMd = { id: string; titulo: string; corpo: string };

function apelido(titulo: string, i: number) {
  const base = semAcento(titulo.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base ? `s-${base}` : `s-${i}`;
}

/** Cada `## ` vira uma seção — é o que forma os cartões e a barra de navegação. */
export function partirSecoes(corpo: string): SecaoMd[] {
  const linhas = (corpo ?? "").replace(/\r\n/g, "\n").split("\n");
  const secoes: { titulo: string; corpo: string }[] = [];
  let atual: { titulo: string; linhas: string[] } | null = null;
  const abertura: string[] = [];

  for (const linha of linhas) {
    const cabecalho = linha.match(/^##\s+(.*)$/);
    if (cabecalho) {
      if (atual) secoes.push({ titulo: atual.titulo, corpo: atual.linhas.join("\n").trim() });
      atual = { titulo: cabecalho[1].trim(), linhas: [] };
      continue;
    }
    (atual ? atual.linhas : abertura).push(linha);
  }
  if (atual) secoes.push({ titulo: atual.titulo, corpo: atual.linhas.join("\n").trim() });

  const cabeca = abertura.join("\n").trim();
  if (cabeca) secoes.unshift({ titulo: "Resumo", corpo: cabeca });

  return secoes
    .filter((s) => s.titulo || s.corpo)
    .map((s, i) => ({ id: apelido(s.titulo, i), titulo: s.titulo, corpo: s.corpo }));
}
