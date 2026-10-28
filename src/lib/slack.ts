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

/** Link do Drive ("…/file/d/<id>/…" ou "?id=<id>") vira link de download direto; outros ficam como estão. */
function linkDireto(url: string) {
  const id = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)?.[1] ?? url.match(/drive\.google\.com\/.*[?&]id=([\w-]+)/)?.[1];
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

/** Baixa a imagem do link. Falha com mensagem clara se o link não devolver uma imagem pública. */
export async function baixarImagem(url: string): Promise<{ bytes: ArrayBuffer; filename: string }> {
  const res = await fetch(linkDireto(url.trim()), { redirect: "follow" });
  const tipo = res.headers.get("content-type") ?? "";
  if (!res.ok || !tipo.startsWith("image/")) {
    throw new Error(
      "Não consegui baixar a imagem do link. Se for do Drive, compartilhe como \"Qualquer pessoa com o link\"; se não, use o link direto do arquivo."
    );
  }
  const ext = tipo.split("/")[1]?.split(";")[0]?.replace("jpeg", "jpg") || "png";
  return { bytes: await res.arrayBuffer(), filename: `disparo.${ext}` };
}

const ERROS_UPLOAD: Record<string, string> = {
  missing_scope: "O app do Slack está sem o escopo files:write (para subir imagem). Adicione o escopo e reinstale o app.",
};

interface UploadArgs {
  /** id do canal (C…) — o upload externo não aceita "#nome". */
  channel: string;
  threadTs: string;
  /** texto que vai junto com a imagem, na mesma mensagem */
  initialComment: string;
  bytes: ArrayBuffer;
  filename: string;
}

/**
 * Sobe a imagem com o texto numa mensagem só, dentro da thread.
 * Caminho novo do Slack: files.getUploadURLExternal → envio dos bytes → files.completeUploadExternal
 * (files.upload foi desativado).
 */
export async function uploadImagem({ channel, threadTs, initialComment, bytes, filename }: UploadArgs) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN não configurado — adicione a variável de ambiente na Vercel.");
  const falha = (code: string) => new Error(ERROS_UPLOAD[code] ?? ERROS[code] ?? `Erro do Slack no envio da imagem: ${code}`);

  // 1) pede o endereço de upload
  const r1 = await fetch(`${SLACK_API}/files.getUploadURLExternal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ filename, length: String(bytes.byteLength) }),
  });
  const d1 = (await r1.json()) as { ok: boolean; error?: string; upload_url?: string; file_id?: string };
  if (!d1.ok || !d1.upload_url || !d1.file_id) throw falha(d1.error ?? `http_${r1.status}`);

  // 2) manda os bytes
  const r2 = await fetch(d1.upload_url, { method: "POST", body: bytes });
  if (!r2.ok) throw falha(`upload_http_${r2.status}`);

  // 3) publica na thread, com o texto junto
  const r3 = await fetch(`${SLACK_API}/files.completeUploadExternal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      files: [{ id: d1.file_id, title: filename }],
      channel_id: channel,
      thread_ts: threadTs,
      initial_comment: initialComment,
    }),
  });
  const d3 = (await r3.json()) as { ok: boolean; error?: string };
  if (!d3.ok) throw falha(d3.error ?? `http_${r3.status}`);
}
