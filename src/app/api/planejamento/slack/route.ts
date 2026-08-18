import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CANAL_ENTREGA_DISPAROS, postMessage, slackEscape } from "@/lib/slack";

// Prefixo fixo do título da thread. Se um dia precisar variar por frente,
// é só trocar por um mapa frente -> prefixo.
const PREFIXO = "REVENDA";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "2026-08" + 18 -> "18/08/2026" */
function dataBR(mes: string, dia: number) {
  const [ano, m] = mes.split("-");
  return `${pad2(dia)}/${m}/${ano}`;
}

/** [REVENDA - Opp 1 - E-mail - Santinho - 18/08/2026] */
export function tituloThread(titulo: string, mes: string, dia: number) {
  const nome = titulo.trim() || "(sem título)";
  return `[${PREFIXO} - ${nome} - ${dataBR(mes, dia)}]`;
}

/** Corpo da thread: a mensagem montada no planejamento (WhatsApp e/ou e-mail). */
export function corpoThread(acao: { whatsapp: string | null; email: string | null }) {
  const partes: string[] = [];
  const wpp = acao.whatsapp?.trim();
  const mail = acao.email?.trim();

  // Quando só um dos dois está preenchido, vai puro — sem rótulo.
  if (wpp && !mail) return wpp;
  if (mail && !wpp) return mail;

  if (wpp) partes.push(`*WhatsApp*\n${wpp}`);
  if (mail) partes.push(`*E-mail*\n${mail}`);
  return partes.join("\n\n———\n\n");
}

export async function POST(request: Request) {
  try {
    const { acaoId, force } = await request.json();
    if (!acaoId) {
      return NextResponse.json({ error: "acaoId é obrigatório" }, { status: 400 });
    }

    const acao = await db.planejamentoAcao.findUnique({ where: { id: acaoId } });
    if (!acao) {
      return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
    }

    if (acao.slackTs && !force) {
      return NextResponse.json({
        alreadySent: true,
        slackEnviadoEm: acao.slackEnviadoEm,
        error: "Esta ação já foi enviada no Slack.",
      }, { status: 409 });
    }

    const corpo = corpoThread(acao);
    if (!corpo) {
      return NextResponse.json(
        { error: "A ação não tem mensagem de WhatsApp nem de e-mail para enviar." },
        { status: 400 }
      );
    }

    // 1) mensagem-pai: só o título entre colchetes
    const pai = await postMessage({ text: slackEscape(tituloThread(acao.titulo, acao.mes, acao.dia)) });

    // 2) resposta na thread: a mensagem do disparo
    await postMessage({ channel: pai.channel, threadTs: pai.ts, text: slackEscape(corpo) });

    const atualizada = await db.planejamentoAcao.update({
      where: { id: acao.id },
      data: { slackTs: pai.ts, slackEnviadoEm: new Date() },
    });

    revalidatePath("/planejamento-organico");
    return NextResponse.json({
      success: true,
      canal: CANAL_ENTREGA_DISPAROS,
      slackTs: atualizada.slackTs,
      slackEnviadoEm: atualizada.slackEnviadoEm,
    });
  } catch (error) {
    console.error("Erro ao enviar planejamento no Slack:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
