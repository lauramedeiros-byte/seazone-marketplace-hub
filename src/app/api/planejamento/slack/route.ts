import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CANAL_ENTREGA_DISPAROS, baixarImagem, postMessage, slackEscape, uploadImagem } from "@/lib/slack";
import { linhaDisparazone, sugerirMarcacao } from "@/lib/disparazone";

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

type AcaoTexto = { whatsapp: string | null; email: string | null; anotacoes: string | null };

/**
 * Respostas da thread, na ordem (pedido da Lívia, 28/10/2026, para o Disparazone cadastrar o template):
 * 1ª: as Anotações (e o e-mail, se houver — não é template de WhatsApp);
 * 2ª e última: SÓ o texto do WhatsApp, com a marcação do Disparazone na última linha.
 * Ação só de e-mail não marca o Disparazone: vai como antes, numa resposta só.
 * Os textos já saem escapados para o Slack (a menção <@…> não pode ser escapada).
 */
export function respostasThread(acao: AcaoTexto, marcacao: string) {
  const wpp = acao.whatsapp?.trim();
  const mail = acao.email?.trim();
  const notas = acao.anotacoes?.trim();

  const primeira: string[] = [];
  if (notas) primeira.push(`*Anotações*\n${notas}`);
  if (mail) primeira.push(wpp || notas ? `*E-mail*\n${mail}` : mail);

  const respostas: string[] = [];
  if (primeira.length) respostas.push(slackEscape(primeira.join("\n\n———\n\n")));
  if (wpp) respostas.push(`${slackEscape(wpp)}\n\n${linhaDisparazone(slackEscape(marcacao))}`);
  return respostas;
}

export async function POST(request: Request) {
  try {
    const { acaoId, force, marcacao } = await request.json();
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

    const linha =
      typeof marcacao === "string" && marcacao.trim() ? marcacao : sugerirMarcacao(acao.titulo, acao.empreendimentos);
    const respostas = respostasThread(acao, linha);
    if (!acao.whatsapp?.trim() && !acao.email?.trim()) {
      return NextResponse.json(
        { error: "A ação não tem mensagem de WhatsApp nem de e-mail para enviar." },
        { status: 400 }
      );
    }

    // Imagem (opcional) sobe junto com o template. Baixa antes de abrir a thread: link ruim
    // dá erro aqui, sem deixar uma thread pela metade no canal.
    const imagem = acao.imagemUrl?.trim() && acao.whatsapp?.trim() ? await baixarImagem(acao.imagemUrl) : null;

    // 1) mensagem-pai: só o título entre colchetes
    const pai = await postMessage({ text: slackEscape(tituloThread(acao.titulo, acao.mes, acao.dia)) });

    // 2) respostas na thread, em ordem: anotações, depois o template com a marcação do Disparazone.
    // Com imagem, a última vai como arquivo + texto numa mensagem só. Se o upload falhar, o template
    // vai só em texto (o Disparazone ainda cadastra) e a tela avisa.
    let aviso: string | undefined;
    for (const [i, text] of respostas.entries()) {
      if (imagem && i === respostas.length - 1) {
        try {
          await uploadImagem({ channel: pai.channel, threadTs: pai.ts, initialComment: text, ...imagem });
          continue;
        } catch (e) {
          aviso = `O template foi sem a imagem: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      await postMessage({ channel: pai.channel, threadTs: pai.ts, text });
    }

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
      aviso,
    });
  } catch (error) {
    console.error("Erro ao enviar planejamento no Slack:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
