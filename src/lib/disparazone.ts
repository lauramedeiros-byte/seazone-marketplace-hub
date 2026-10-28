// Marcação do Disparazone (bot que cadastra o template de WhatsApp sozinho).
// Pedido da Lívia Cunha (28/10/2026): a última resposta da thread no #entrega_disparos é só o
// texto do template, e a última linha marca o Disparazone com o comando, a vertical e o tema +
// empreendimento. Tudo depois da marcação entraria no template, por isso ela fica no fim.

/** Usuário do Disparazone no Slack — a menção tem que ir como <@id>, não "@Disparazone" escrito. */
export const DISPARAZONE_ID = "U0BQ39MGAGH";

/** Vertical fixa, como o prefixo REVENDA do título da thread. */
export const VERTICAL = "MKTP";

/**
 * Sugere "tema + empreendimento" a partir do título da ação.
 * "Reativação - 630 Lost sem opp do disparo Rosa de 22/09 - oferta: Rosa Norte Spot 110"
 *   -> "reativação Rosa Norte Spot 110"
 * Tema = primeiro trecho do título (antes do " - "), se não for a base (começa com número).
 * Empreendimento = o que vem depois de "oferta:"; sem isso, o campo empreendimentos.
 */
export function sugerirTema(titulo: string, empreendimentos?: string | null) {
  const t = titulo.replace(/^\s*\[[^\]]*\]\s*/, "").trim(); // tira "[SIA AGENDADORA]"
  const oferta = t.match(/oferta:\s*(.+)$/i)?.[1]?.trim() || empreendimentos?.trim() || "";
  const trechos = t.split(" - ");
  const primeiro = trechos.length > 1 ? trechos[0].trim() : "";
  const tema = primeiro && !/^\d/.test(primeiro) ? primeiro.charAt(0).toLowerCase() + primeiro.slice(1) : "";
  return [tema, oferta].filter(Boolean).join(" ") || t;
}

/** "MKTP, reativação Rosa Norte Spot 110" — o que vai depois de "cadastre esse template, ". */
export function sugerirMarcacao(titulo: string, empreendimentos?: string | null) {
  return `${VERTICAL}, ${sugerirTema(titulo, empreendimentos)}`;
}

/** Última linha da thread. Sem quebra de linha: só a última linha é lida como comando. */
export function linhaDisparazone(marcacao: string) {
  return `<@${DISPARAZONE_ID}> cadastre esse template, ${marcacao.replace(/\s+/g, " ").trim()}`;
}
