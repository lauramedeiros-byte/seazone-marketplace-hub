import { db } from "@/lib/db";

// Frente onde as propostas aprovadas entram (por nome, para não depender do id).
const FRENTE_NOME = "Disparos Marketplace";

async function frenteMarketplaceId(): Promise<string> {
  const f = await db.planejamentoFrente.findFirst({
    where: { nome: { equals: FRENTE_NOME, mode: "insensitive" } },
  });
  if (!f) throw new Error(`Frente "${FRENTE_NOME}" não encontrada no planejamento`);
  return f.id;
}

// Aprovar = preencher o planejamento do jeito que a Laura faz hoje.
// - Proposta ligada a uma ação que ela já planejou: só completa a copy (e empreendimentos
//   se estiver vazio). Título, base e RD campanha dela ficam intactos.
// - Proposta nova: cria a ação no dia, no fim da lista. "base" e "RD campanha" ficam
//   vazios — ela preenche quando o disparo sai.
export async function aprovarProposta(id: string, whatsappEditado?: string) {
  const p = await db.propostaDisparo.findUnique({ where: { id } });
  if (!p) throw new Error("Proposta não encontrada");
  if (p.status === "aprovada" && p.acaoId) return p;

  const whatsapp = whatsappEditado?.trim() || p.whatsapp;
  const nota = [
    "Proposta do agente de disparos",
    p.contatos ? `~${p.contatos.toLocaleString("pt-BR")} contatos` : null,
    p.base,
  ]
    .filter(Boolean)
    .join(" · ");

  let acaoId: string;
  const existente = p.acaoExistenteId
    ? await db.planejamentoAcao.findUnique({ where: { id: p.acaoExistenteId } })
    : null;

  if (existente) {
    const a = await db.planejamentoAcao.update({
      where: { id: existente.id },
      data: {
        whatsapp,
        ...(existente.empreendimentos ? {} : { empreendimentos: p.empreendimentos }),
        ...(existente.anotacoes ? {} : { anotacoes: nota }),
      },
    });
    acaoId = a.id;
  } else {
    const frenteId = await frenteMarketplaceId();
    const ordem = await db.planejamentoAcao.count({ where: { frenteId, mes: p.mes, dia: p.dia } });
    const a = await db.planejamentoAcao.create({
      data: {
        frenteId,
        mes: p.mes,
        dia: p.dia,
        titulo: p.titulo,
        empreendimentos: p.empreendimentos,
        whatsapp,
        anotacoes: nota,
        links: [],
        ordem,
      },
    });
    acaoId = a.id;
  }

  return db.propostaDisparo.update({
    where: { id },
    data: { status: "aprovada", whatsapp, acaoId, decididoEm: new Date() },
  });
}

// Reprovar = guardar o comentário como aprendizado. O agente lê os reprovados
// pendentes no repasse seguinte e propõe outra mensagem no lugar.
export async function reprovarProposta(id: string, comentario: string) {
  const texto = comentario.trim();
  if (!texto) throw new Error("Escreva o que não ficou legal para o agente aprender");
  const p = await db.propostaDisparo.update({
    where: { id },
    data: { status: "reprovada", comentario: texto, decididoEm: new Date() },
  });
  await db.aprendizadoDisparo.create({
    data: { texto: `${p.titulo} → ${texto}`, origemPropostaId: id },
  });
  return p;
}
