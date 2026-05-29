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

      // Criar 4 formatos padrão com estruturas e variações em batch
      const formatos = ["Estático", "Vídeo Narrado", "Vídeo Apresentadora", "Vídeos Disruptivos"];

      // Prepara todos os dados em memória
      const allFormatos: Array<{ nome: string; estruturas: Array<{ nome: string; variacoes: string[] }> }> = [];
      for (const nome of formatos) {
        const estruturas = [];
        for (let e = 1; e <= 4; e++) {
          const variacoes = [];
          for (let v = 1; v <= 5; v++) {
            variacoes.push(`V${v}`);
          }
          estruturas.push({ nome: `E${e}`, variacoes });
        }
        allFormatos.push({ nome, estruturas });
      }

      // Cria formatos um a um (precisa do ID para criar estruturas)
      const formatosCriados = [];
      for (const fmt of allFormatos) {
        const formato = await db.midiaPagaFormato.create({
          data: { prioridadeId: prioridade.id, nome: fmt.nome },
        });
        formatosCriados.push({ id: formato.id, estruturas: fmt.estruturas });
      }

      // Cria todas as estruturas em batch para cada formato
      const allEstruturas: Array<{ formatoId: string; nome: string }> = [];
      for (const fmt of formatosCriados) {
        for (const est of fmt.estruturas) {
          allEstruturas.push({ formatoId: fmt.id, nome: est.nome });
        }
      }

      // Usa createMany para estruturas (se disponível) ou batch simples
      const estruturasCriadas = [];
      for (const est of allEstruturas) {
        const estrutura = await db.midiaPagaEstrutura.create({
          data: { formatoId: est.formatoId, nome: est.nome },
        });
        estruturasCriadas.push(estrutura);
      }

      // Cria todas as variações em batch
      const allVariacoes: Array<{ estruturaId: string; nome: string }> = [];
      for (const est of estruturasCriadas) {
        for (let v = 1; v <= 5; v++) {
          allVariacoes.push({ estruturaId: est.id, nome: `V${v}` });
        }
      }

      // Batch insert das variações
      for (const varData of allVariacoes) {
        await db.midiaPagaVariacao.create({ data: varData });
      }

      // Retorna a prioridade completa com formatos
      const prioridadeCompleta = await db.midiaPagaPrioridade.findUnique({
        where: { id: prioridade.id },
        include: {
          empreendimento: true,
          formatos: {
            include: {
              estruturas: {
                include: { variacoes: true },
              },
            },
          },
        },
      });

      return NextResponse.json(prioridadeCompleta);
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
      // Return estrutura com variacoes
      const estruturaCompleta = await db.midiaPagaEstrutura.findUnique({
        where: { id: estrutura.id },
        include: { variacoes: true },
      });
      return NextResponse.json(estruturaCompleta);
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