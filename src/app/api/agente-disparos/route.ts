import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { nomeFrente } from "@/lib/propostas-disparo";

// Rota do agente local (tarefa do Windows na máquina da Laura). Fora do Clerk,
// protegida pelo header x-agente-token = AGENTE_DISPAROS_TOKEN.
function autorizado(request: Request) {
  const esperado = process.env.AGENTE_DISPAROS_TOKEN;
  return !!esperado && request.headers.get("x-agente-token") === esperado;
}

// GET ?mes=YYYY-MM&dia=D[&origem=propostas|opp-semana]  → planejamento do dia (frente
// Disparos Marketplace), propostas do dia, reprovadas ainda sem substituta, aprendizados
// ativos e o pedido de repasse em aberto (botão "Gerar aprendizado"), se houver.
// `origem` separa os agentes: reprovadas e aprendizados vêm só da origem pedida
// (padrão "propostas" = agente das 11h, que não manda o parâmetro).
// origem=comunidade (agente da comunidade, segunda 8h40): frente "Comunidade WPP" e, sem
// mes/dia, os posts e as propostas dos últimos ~60 dias (tom, temas já usados, dias ocupados).
export async function GET(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const url = new URL(request.url);
  const mes = url.searchParams.get("mes");
  const dia = Number(url.searchParams.get("dia"));
  const o = url.searchParams.get("origem");
  const origem = o === "opp-semana" || o === "comunidade" ? o : "propostas";

  const frente = await db.planejamentoFrente.findFirst({
    where: { nome: { equals: nomeFrente(origem), mode: "insensitive" } },
  });

  if (origem === "comunidade" && !(mes && dia)) {
    const desde = new Date(Date.now() - 62 * 86400000).toISOString().slice(0, 7); // "YYYY-MM"
    const [acoes, propostas, aprendizados, pedido] = await Promise.all([
      frente
        ? db.planejamentoAcao.findMany({
            where: { frenteId: frente.id, mes: { gte: desde } },
            orderBy: [{ mes: "asc" }, { dia: "asc" }, { ordem: "asc" }],
          })
        : Promise.resolve([]),
      db.propostaDisparo.findMany({
        where: { origem, mes: { gte: desde } },
        orderBy: [{ mes: "asc" }, { dia: "asc" }, { ordem: "asc" }],
      }),
      db.aprendizadoDisparo.findMany({ where: { ativo: true, origem }, orderBy: { criadoEm: "asc" } }),
      db.pedidoRepasseDisparo.findFirst({
        where: { status: { in: ["pendente", "andamento"] } },
        orderBy: { criadoEm: "asc" },
      }),
    ]);
    const reprovadas = propostas.filter((p) => p.status === "reprovada");
    return NextResponse.json({ acoes, propostas, reprovadas, aprendizados, pedido });
  }
  const [acoes, propostas, reprovadas, aprendizados, pedido] = await Promise.all([
    frente && mes && dia
      ? db.planejamentoAcao.findMany({ where: { frenteId: frente.id, mes, dia }, orderBy: { ordem: "asc" } })
      : Promise.resolve([]),
    mes && dia
      ? db.propostaDisparo.findMany({ where: { mes, dia }, orderBy: { ordem: "asc" } })
      : Promise.resolve([]),
    db.propostaDisparo.findMany({ where: { status: "reprovada", origem }, orderBy: { decididoEm: "asc" } }),
    db.aprendizadoDisparo.findMany({ where: { ativo: true, origem }, orderBy: { criadoEm: "asc" } }),
    db.pedidoRepasseDisparo.findFirst({
      where: { status: { in: ["pendente", "andamento"] } },
      orderBy: { criadoEm: "asc" },
    }),
  ]);
  return NextResponse.json({ acoes, propostas, reprovadas, aprendizados, pedido });
}

// PATCH { pedidoId, status: "andamento" | "feito" | "erro", mensagem? } → a vigia local
// marca o pedido do botão "Gerar aprendizado" (a página mostra o andamento).
export async function PATCH(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { pedidoId, status, mensagem } = await request.json();
  if (!pedidoId || !["andamento", "feito", "erro"].includes(status))
    return NextResponse.json({ error: "Envie { pedidoId, status: andamento|feito|erro }" }, { status: 400 });
  const pedido = await db.pedidoRepasseDisparo.update({
    where: { id: pedidoId },
    data: {
      status,
      mensagem: mensagem ? String(mensagem).slice(0, 2000) : null,
      ...(status === "andamento" ? { iniciadoEm: new Date() } : { concluidoEm: new Date() }),
    },
  });
  revalidatePath("/planejamento-organico/propostas");
  return NextResponse.json({ success: true, pedido });
}

// POST { propostas: [...] }  → cria propostas. Uma proposta com substituiId marca a
// reprovada como "substituida" (sai da fila de repasse).
export async function POST(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { propostas } = await request.json();
    if (!Array.isArray(propostas) || propostas.length === 0)
      return NextResponse.json({ error: "Envie { propostas: [...] }" }, { status: 400 });

    const criadas = [];
    const ignoradas: string[] = [];
    for (const p of propostas) {
      if (!p.mes || !p.dia || !p.titulo || !p.whatsapp)
        return NextResponse.json({ error: "Cada proposta precisa de mes, dia, titulo e whatsapp" }, { status: 400 });
      // Substituta de uma reprovada que já foi refeita (duas execuções ao mesmo tempo) ou que a
      // Laura voltou para pendente: não cria outra, senão o dia fica duplicado.
      if (p.substituiId) {
        const alvo = await db.propostaDisparo.findUnique({ where: { id: p.substituiId } });
        if (!alvo || alvo.status !== "reprovada") {
          ignoradas.push(p.substituiId);
          continue;
        }
      }
      const ordem = await db.propostaDisparo.count({ where: { mes: p.mes, dia: Number(p.dia) } });
      const c = await db.propostaDisparo.create({
        data: {
          mes: p.mes,
          dia: Number(p.dia),
          ordem,
          titulo: String(p.titulo),
          base: p.base ?? null,
          contatos: p.contatos != null ? Number(p.contatos) : null,
          empreendimentos: p.empreendimentos ?? null,
          whatsapp: String(p.whatsapp),
          imagemUrl: p.imagemUrl ? String(p.imagemUrl) : null,
          racional: p.racional ?? null,
          substituiId: p.substituiId ?? null,
          acaoExistenteId: p.acaoExistenteId ?? null,
          origem: p.origem === "opp-semana" || p.origem === "comunidade" ? p.origem : "propostas",
          oppItemId: p.oppItemId ?? null,
        },
      });
      if (p.substituiId)
        await db.propostaDisparo.update({ where: { id: p.substituiId }, data: { status: "substituida" } });
      criadas.push(c);
    }
    revalidatePath("/planejamento-organico/propostas");
    return NextResponse.json({ success: true, criadas: criadas.map((c) => c.id), ignoradas });
  } catch (error) {
    console.error("Erro na API agente-disparos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
