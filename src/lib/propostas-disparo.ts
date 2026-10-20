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

// Tudo que a página mostra, num formato só (usado no render e no polling da página).
// Aprovadas e histórico ficam 30 dias; pendentes e reprovadas aparecem sempre.
export async function dadosPaginaPropostas() {
  const ini = new Date(Date.now() - 30 * 86400000 - 3 * 3600000).toISOString().slice(0, 10); // BRT
  const [todas, aprendizados, pedido] = await Promise.all([
    db.propostaDisparo.findMany({ orderBy: [{ mes: "asc" }, { dia: "asc" }, { ordem: "asc" }] }),
    db.aprendizadoDisparo.findMany({ orderBy: { criadoEm: "desc" } }),
    db.pedidoRepasseDisparo.findFirst({ orderBy: { criadoEm: "desc" } }),
  ]);
  const propostas = todas.filter(
    (p) =>
      p.status === "pendente" ||
      p.status === "reprovada" ||
      `${p.mes}-${String(p.dia).padStart(2, "0")}` >= ini
  );

  // Pendente que completava uma ação que a Laura apagou do planejamento: aprovar criaria
  // uma ação nova com o título antigo (duplicando o dia). A página avisa e oferece descartar.
  const ligadas = propostas.filter((p) => p.status === "pendente" && p.acaoExistenteId);
  const existentes = new Set(
    (
      await db.planejamentoAcao.findMany({
        where: { id: { in: ligadas.map((p) => p.acaoExistenteId!) } },
        select: { id: true },
      })
    ).map((a) => a.id)
  );
  return {
    propostas: propostas.map((p) => ({
      ...p,
      acaoApagada: !!p.acaoExistenteId && p.status === "pendente" && !existentes.has(p.acaoExistenteId),
    })),
    aprendizados,
    pedido,
  };
}

// "Gerar aprendizado": um pedido aberto por vez (pendente ou em andamento).
export async function pedirRepasse() {
  const aberto = await db.pedidoRepasseDisparo.findFirst({
    where: { status: { in: ["pendente", "andamento"] } },
    orderBy: { criadoEm: "desc" },
  });
  if (aberto) return aberto;
  const reprovadas = await db.propostaDisparo.count({ where: { status: "reprovada" } });
  if (reprovadas === 0) throw new Error("Não há proposta reprovada esperando o agente");
  return db.pedidoRepasseDisparo.create({ data: {} });
}

// Reprovar = guardar o comentário como aprendizado. O agente refaz quando a Laura clica em
// "Gerar aprendizado" (vigia local) ou, sem o clique, no repasse de 30 em 30 min.
export async function reprovarProposta(id: string, comentario: string) {
  const texto = comentario.trim();
  if (!texto) throw new Error("Escreva o que não ficou legal para o agente aprender");
  const p = await db.propostaDisparo.update({
    where: { id },
    data: { status: "reprovada", comentario: texto, decididoEm: new Date() },
  });
  await db.aprendizadoDisparo.create({
    data: { texto: `${p.titulo} → ${texto}`, origemPropostaId: id, origem: p.origem },
  });
  return p;
}
