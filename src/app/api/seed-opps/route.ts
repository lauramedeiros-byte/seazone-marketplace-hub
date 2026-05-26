import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

const weeksData = [
  {
    weekStart: "2026-05-04", // Week of 10/05
    items: [
      {
        nome: "Santinho Spot - 309B",
        preco: "R$ 289.000,02",
        condicoes: "ágio zero; parcela entrada até 3x",
      },
      {
        nome: "Rosa Sul - 25",
        preco: "R$ 398.000,00",
        condicoes: "41% abaixo do valor de mercado; entrega esse ano",
      },
      {
        nome: "Urubici Spot - 306",
        preco: "R$ 286.085,96",
        condicoes: "entrega esse ano",
      },
      {
        nome: "Salvador Spot - 1101",
        preco: "R$ 380.980,45",
        condicoes: "parcela entrada até 6x",
      },
      {
        nome: "Canasvieiras Spot - 211",
        preco: "R$ 263.871,91",
        condicoes: "aceita parcelamento; 7% abaixo do valor de mercado",
      },
      {
        nome: "Novo Campeche Spot - 314",
        preco: "R$ 376.815,14",
        condicoes: "15% abaixo do valor de mercado",
      },
      {
        nome: "Cachoeira Spot - 413",
        preco: "R$ 327.979,09",
        condicoes: "23% abaixo do valor de mercado",
      },
      {
        nome: "Ingleses Spot - 305",
        preco: "R$ 350.000,00",
        condicoes: "entrega esse ano; parcelamento em 5x",
      },
    ],
    selected: ["Canas Beach Spot", "Canasvieiras Spot - 211"],
    justificativas: {
      "Canas Beach Spot": "ROSA SUL foi cancelada, trocamos para Canas Beach, uma cota que entrou com condição muito boa",
      "Canasvieiras Spot - 211": "SPOT mais barato desta lista, aceita parcelamento que é ótimo e ainda tá com um valor OK abaixo de mercado, e o valor de entrada é menor que o valor total que ajuda também",
    },
  },
  {
    weekStart: "2026-05-11", // Week of 18/05
    items: [
      {
        nome: "Rosa Norte - 302",
        preco: "R$ 322.000,00",
        condicoes: "6x certeza de parcelamento (obras iniciadas)",
      },
      {
        nome: "Cachoeira - 405",
        preco: "R$ 418.500,00",
        condicoes: "6x certeza de parcelamento (obras iniciadas); ágio zero; tem vista",
      },
      {
        nome: "Ingleses - 103",
        preco: "R$ 418.500,00",
        condicoes: "6x certeza de parcelamento (obras finalizando, previsão de entrega 06/26); GARDEN",
      },
      {
        nome: "Vistas de Anitá - 05",
        preco: "R$ 285.000,00",
        condicoes: "6x certeza de parcelamento - Cabana mais barata",
      },
      {
        nome: "Campeche - 204",
        preco: "R$ 297.869,47",
        condicoes: "3x certeza de parcelamento - cota mais barata",
      },
      {
        nome: "Rosa - 15",
        preco: "R$ 450.000,00",
        condicoes: "6x certeza de parcelamento - cota mais barata; grande flexibilidade na negociação",
      },
      {
        nome: "Batel - 307",
        preco: "R$ 332.347,89",
        condicoes: "6x certeza de parcelamento; cedente flexível",
      },
      {
        nome: "Meireles - 505",
        preco: "R$ 316.813,55",
        condicoes: "6x certeza de parcelamento",
      },
    ],
    selected: ["Vistas de Anitá - 05", "Ingleses - 103"],
    justificativas: {
      "Vistas de Anitá - 05": "Vistas tem bastante cota a venda do I, é um dos faturamentos no ano mais altos comparado com as outras opções da opp da semana (R$ 57.668,66, cerca de R$ 4.800 por mês), o investidor já começa a ganhar no curto prazo",
      "Ingleses - 103": "Mesmo valor de Cachoeira, praia também no norte da ilha que é super valorizado, mas entrega agora em junho pra começar a ganhar com airbnb no curto prazo e ainda aceita mais parcelamento",
    },
  },
  {
    weekStart: "2026-05-18", // Week of 25/05
    items: [
      {
        nome: "Bonito Spot - 301",
        preco: "R$ 212.836,55",
        condicoes: "Aceita parcelamento; Entrada de R$ 35.472,78; Distrato",
      },
      {
        nome: "Ponta das Canas Spot - 326",
        preco: "R$ 230.000,16",
        condicoes: "6x; Entrada de R$ 84.717,57",
      },
      {
        nome: "Sul da Ilha Spot - 413",
        preco: "R$ 370.575,90",
        condicoes: "Aceita parcelamento; Entrada de R$ 87.106,41",
      },
      {
        nome: "Novo Campeche Spot - 108",
        preco: "R$ 366.935,69",
        condicoes: "Aceita parcelamento; Entrada de R$ 88.551,90; Garden",
      },
      {
        nome: "Santo Antônio Spot - 207",
        preco: "R$ 291.546,21",
        condicoes: "até 10x; Entrada de R$ 93.937,09; Ágio zero (preço de lançamento)",
      },
      {
        nome: "Morro das Pedras Spot - 218",
        preco: "R$ 344.401,52",
        condicoes: "até 8x; Entrada de R$ 153.402,15",
      },
      {
        nome: "Ilha do Campeche - 413",
        preco: "R$ 355.000,00",
        condicoes: "Aceita parcelamento; Entrada de R$ 88.138,92 (em 3x de R$ 29.379,64); vista mar",
      },
      {
        nome: "Salvador Spot - 804",
        preco: "R$ 320.767,01",
        condicoes: "até 10x; Entrada de R$ 183.545,57",
      },
    ],
    selected: ["Santo Antônio Spot - 207", "Ilha do Campeche - 413"],
    justificativas: {
      "Santo Antônio Spot - 207": "Valor de investimento baixo, assim como a entrada; preço de lançamento (ágio zero); parcela em 10x; a unidade ofertada tem vista lateral para o mar, e o prédio em si fica na beira-mar, que valoriza bastante a oportunidade",
      "Ilha do Campeche - 413": "Vista mar; entrada bem baixa; aceita parcelamento; faturamento ao ano é bem alto, é o maior comparado com as outras cotas (R$ 79.452,85)",
    },
  },
];

export async function POST() {
  try {
    let created = 0;

    for (const week of weeksData) {
      const weekStart = new Date(week.weekStart);

      // Create or get week
      let semana = await db.oppSemana.findUnique({
        where: { weekStart },
      });

      if (!semana) {
        semana = await db.oppSemana.create({
          data: { weekStart },
        });
      }

      // Check if items already exist
      const existingItems = await db.oppItem.count({
        where: { semanaId: semana.id },
      });

      if (existingItems === 0) {
        for (const item of week.items) {
          const isSelected = week.selected.some((s) =>
            item.nome.toLowerCase().includes(s.toLowerCase())
          );

          const justificativa = isSelected
            ? Object.entries(week.justificativas).find(([key]) =>
                item.nome.toLowerCase().includes(key.toLowerCase())
              )?.[1]
            : null;

          await db.oppItem.create({
            data: {
              semanaId: semana.id,
              nomeEmpreendimento: item.nome,
              preco: item.preco,
              condicoes: item.condicoes,
              destaque: isSelected,
              justificativa: justificativa || null,
            },
          });
          created++;
        }
      }
    }

    revalidatePath("/opps-da-semana");

    return NextResponse.json({
      success: true,
      message: `${created} oportunidades criadas`,
    });
  } catch (error) {
    console.error("Erro no seed de opps:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}