// Envio de mensagens para o Slack via bot token (chat.postMessage).
// Requer SLACK_BOT_TOKEN (escopo chat:write) e o bot convidado no canal.

const SLACK_API = "https://slack.com/api";

/** Canal padrão de entrega dos disparos. Pode ser id (C…) ou "#nome". */
export const CANAL_ENTREGA_DISPAROS = process.env.SLACK_CHANNEL_ENTREGA_DISPAROS || "#entrega_disparos";

/** Slack pede que só &, < e > sejam escapados no texto da mensagem. */
export function slackEscape(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ERROS: Record<string, string> = {
  not_in_channel: `O bot não está no canal ${CANAL_ENTREGA_DISPAROS}. Abra o canal no Slack e mande: /invite @nome-do-bot`,
  channel_not_found: `Canal ${CANAL_ENTREGA_DISPAROS} não encontrado. Se for canal privado, o bot precisa ser convidado; confira também o nome em SLACK_CHANNEL_ENTREGA_DISPAROS.`,
  invalid_auth: "SLACK_BOT_TOKEN inválido ou revogado.",
  not_authed: "SLACK_BOT_TOKEN ausente na requisição.",
  missing_scope: "O app do Slack está sem o escopo chat:write. Adicione o escopo e reinstale o app.",
  is_archived: `O canal ${CANAL_ENTREGA_DISPAROS} está arquivado.`,
  msg_too_long: "A mensagem passou do limite do Slack (~40 mil caracteres).",
  ratelimited: "O Slack limitou a taxa de envio. Tente de novo em alguns segundos.",
};

interface PostArgs {
  channel?: string;
  text: string;
  /** ts da mensagem-pai — preenchido para responder dentro da thread. */
  threadTs?: string;
}

export async function postMessage({ channel, text, threadTs }: PostArgs): Promise<{ ts: string; channel: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN não configurado — adicione a variável de ambiente na Vercel.");
  }

  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: channel || CANAL_ENTREGA_DISPAROS,
      text,
      ...(threadTs ? { thread_ts: threadTs } : {}),
      unfurl_links: false,
      unfurl_media: false,
    }),
  });

  const data = (await res.json()) as { ok: boolean; error?: string; ts?: string; channel?: string };
  if (!data.ok || !data.ts) {
    const code = data.error ?? `http_${res.status}`;
    throw new Error(ERROS[code] ?? `Erro do Slack: ${code}`);
  }
  return { ts: data.ts, channel: data.channel ?? channel ?? CANAL_ENTREGA_DISPAROS };
}
