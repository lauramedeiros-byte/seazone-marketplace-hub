import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// Rota do agente local (tarefa do Windows na máquina da Laura). Fora do Clerk,
// protegida pelo header x-agente-token = AGENTE_DISPAROS_TOKEN.
function autorizado(request: Request) {
  const esperado = process.env.AGENTE_DISPAROS_TOKEN;
  return !!esperado && request.headers.get("x-agente-token") === esperado;
}

// GET ?mes=YYYY-MM&dia=D  → planejamento do dia (frente Disparos Marketplace),
// propostas do dia, reprovadas ainda sem substituta e aprendizados ativos.
export async function GET(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const url = new URL(request.url);
  const mes = url.searchParams.get("mes");
  const dia = Number(url.searchParams.get("dia"));

  const frente = await db.planejamentoFrente.findFirst({
    where: { nome: { equals: "Disparos Marketplace", mode: "insensitive" } },
  });
  const [acoes, propostas, reprovadas, aprendizados] = await Promise.all([
    frente && mes && dia
      ? db.planejamentoAcao.findMany({ where: { frenteId: frente.id, mes, dia }, orderBy: { ordem: "asc" } })
      : Promise.resolve([]),
    mes && dia
      ? db.propostaDisparo.findMany({ where: { mes, dia }, orderBy: { ordem: "asc" } })
      : Promise.resolve([]),
    db.propostaDisparo.findMany({ where: { status: "reprovada" }, orderBy: { decididoEm: "asc" } }),
    db.aprendizadoDisparo.findMany({ where: { ativo: true }, orderBy: { criadoEm: "asc" } }),
  ]);
  return NextResponse.json({ acoes, propostas, reprovadas, aprendizados });
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
    for (const p of propostas) {
      if (!p.mes || !p.dia || !p.titulo || !p.whatsapp)
        return NextResponse.json({ error: "Cada proposta precisa de mes, dia, titulo e whatsapp" }, { status: 400 });
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
          racional: p.racional ?? null,
          substituiId: p.substituiId ?? null,
          acaoExistenteId: p.acaoExistenteId ?? null,
        },
      });
      if (p.substituiId)
        await db.propostaDisparo.update({ where: { id: p.substituiId }, data: { status: "substituida" } });
      criadas.push(c);
    }
    revalidatePath("/planejamento-organico/propostas");
    return NextResponse.json({ success: true, criadas: criadas.map((c) => c.id) });
  } catch (error) {
    console.error("Erro na API agente-disparos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
