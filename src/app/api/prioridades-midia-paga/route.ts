import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - listar meses com prioridades
export async function GET() {
  try {
    const meses = await db.midiaPagaMes.findMany({
      orderBy: { mes: "desc" },
      include: {
        priorities: {
          include: {
            empreendimento: true,
            formatos: {
              include: {
                estruturas: {
                  include: {
                    variacoes: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return NextResponse.json(meses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

// POST - criar mês
export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    if (action === "create-mes") {
      const mes = await db.midiaPagaMes.create({ data: { mes: data.mes } });
      return NextResponse.json(mes);
    }

    if (action === "create-empreendimento") {
      const emp = await db.empreendimento.create({ data: { nome: data.nome } });
      return NextResponse.json(emp);
    }

    if (action === "create-empreendimentos-bulk") {
      const results = [];
      for (const nome of data.nomes) {
        try {
          const emp = await db.empreendimento.create({ data: { nome } });
          results.push(emp);
        } catch (e) {
          // Ignora duplicados
        }
      }
      return NextResponse.json(results);
    }

    if (action === "update-empreendimento") {
      const emp = await db.empreendimento.update({
        where: { id: data.id },
        data: { nome: data.nome },
      });
      return NextResponse.json(emp);
    }

    if (action === "add-prioridade") {
      const prioridade = await db.midiaPagaPrioridade.create({
        data: { mesId: data.mesId, empreendimentoId: data.empreendimentoId },
      });
      // Criar 4 formatos padrão
      const formatos = ["Estático", "Vídeo Narrado", "Vídeo Apresentadora", "Vídeos Disruptivos"];
      for (const nome of formatos) {
        const formato = await db.midiaPagaFormato.create({
          data: { prioridadeId: prioridade.id, nome },
        });
        for (let e = 1; e <= 4; e++) {
          const estrutura = await db.midiaPagaEstrutura.create({
            data: { formatoId: formato.id, nome: `E${e}` },
          });
          for (let v = 1; v <= 5; v++) {
            await db.midiaPagaVariacao.create({
              data: { estruturaId: estrutura.id, nome: `V${v}` },
            });
          }
        }
      }
      return NextResponse.json(prioridade);
    }

    if (action === "update-prioridade") {
      const updated = await db.midiaPagaPrioridade.update({
        where: { id: data.id },
        data: {},
      });
      return NextResponse.json(updated);
    }

    if (action === "update-mes") {
      const updated = await db.midiaPagaMes.update({
        where: { id: data.id },
        data: {
          estrategia: data.estrategia ?? null,
          campanhasAtivas: data.campanhasAtivas ?? null,
          briefingsZerados: data.briefingsZerados ?? null,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "toggle-formato") {
      const updated = await db.midiaPagaFormato.update({
        where: { id: data.id },
        data: { checked: data.checked },
      });
      return NextResponse.json(updated);
    }

    if (action === "toggle-estrutura") {
      const updated = await db.midiaPagaEstrutura.update({
        where: { id: data.id },
        data: { checked: data.checked },
      });
      return NextResponse.json(updated);
    }

    if (action === "toggle-variacao") {
      const updated = await db.midiaPagaVariacao.update({
        where: { id: data.id },
        data: { checked: data.checked },
      });
      return NextResponse.json(updated);
    }

    if (action === "add-estrutura") {
      const estrutura = await db.midiaPagaEstrutura.create({
        data: { formatoId: data.formatoId, nome: data.nome },
      });
      for (let v = 1; v <= 5; v++) {
        await db.midiaPagaVariacao.create({
          data: { estruturaId: estrutura.id, nome: `V${v}` },
        });
      }
      return NextResponse.json(estrutura);
    }

    if (action === "add-variacao") {
      const variacao = await db.midiaPagaVariacao.create({
        data: { estruturaId: data.estruturaId, nome: data.nome },
      });
      return NextResponse.json(variacao);
    }

    return NextResponse.json({ error: "Ação não reconhecida" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}

// DELETE - deletar mês
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    if (type === "mes") {
      await db.midiaPagaMes.delete({ where: { id } });
    } else if (type === "empreendimento") {
      await db.empreendimento.delete({ where: { id } });
    } else if (type === "prioridade") {
      await db.midiaPagaPrioridade.delete({ where: { id } });
    } else if (type === "estrutura") {
      await db.midiaPagaEstrutura.delete({ where: { id } });
    } else if (type === "variacao") {
      await db.midiaPagaVariacao.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}