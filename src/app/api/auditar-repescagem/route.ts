import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwnr1VkWXPkt3-Iuho7uSY1d0BUyzudrPRvmC7wWTA69pAnjdlByYQMcnXQiOmIRBOGzg/exec";

function toNumber(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return isNaN(n) ? null : n;
}

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function slugify(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairRendas(texto: string): { anual: string | null; mensal: string | null } {
  function extrair(tipo: "anual" | "mensal"): string | null {
    const patternAnual = /(?:renda\s+líquida\s+(?:mensal\s+)?anual[^$]*?R\$\s*([\d\.]+(?:,\d{2})?))/i;
    const patternMensal = /(?:renda\s+líquida\s+(?:mensal(?:\s+média)?)[^$]*?R\$\s*([\d\.]+(?:,\d{2})?))/i;
    const pattern = tipo === "anual" ? patternAnual : patternMensal;
    const match = texto.match(pattern);
    if (!match) return null;
    const val = match[1].trim();
    const normalized = val.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    if (isNaN(n)) return null;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }
  return { anual: extrair("anual"), mensal: extrair("mensal") };
}

function gerarTexto(params: {
  nomeEmpreendimento: string;
  valorCota: number;
  valorEntrada: number | null;
  emFuncionamento: boolean;
  url: string;
  rendasAnual: string | null;
  rendasMensal: string | null;
  apenasUmaCota: boolean;
}): string {
  const { nomeEmpreendimento, valorCota, valorEntrada, emFuncionamento, url, rendasAnual, rendasMensal, apenasUmaCota } = params;

  const temEntrada = valorEntrada !== null && valorEntrada > 0 && valorEntrada !== valorCota;

  if (emFuncionamento) {
    // ── Pattern B ou C ───────────────────────────────────────────────
    const linhaCota = apenasUmaCota
      ? `temos a última unidade a partir de R$ ${formatBRL(valorCota)}.`
      : `temos as últimas unidades a partir de R$ ${formatBRL(valorCota)}${temEntrada ? `, com entradas a partir de R$ ${formatBRL(valorEntrada)}` : ""}.`;

    const rendasLinha = rendasAnual
      ? `renda líquida anual estimada de R$ ${rendasAnual} e renda líquida mensal de R$ ${rendasMensal}`
      : rendasMensal
      ? `renda líquida mensal média de R$ ${rendasMensal}`
      : "renda líquida mensal média de R$ X,XX";

    const Airbnb = apenasUmaCota
      ? "no curto prazo com Airbnb"
      : "no Airbnb no curto prazo";

    const linhas = [
      `Oi, [NOME]! Como você está?`,
      ``,
      `Recebemos em nosso sistema que você demonstrou interesse no ${nomeEmpreendimento}. Todos os detalhes estão disponíveis aqui: ${url}`,
      ``,
      `O empreendimento já está pronto para você faturar ${Airbnb}, e atualmente, ${linhaCota}`,
      ``,
      `Essa é a oportunidade perfeita para garantir ${rendasLinha}, com a gestão da Seazone!`,
      ``,
      `Pagamento exclusivamente via pix ou parcelamento. Não aceitamos fgts nem carta de crédito.`,
      ``,
      `Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    ];
    return linhas.join("\n");
  }

  // ── Pattern A — com entrada ─────────────────────────────────────
  const linhaCota = temEntrada
    ? `Temos uma oportunidade no valor de R$ ${formatBRL(valorCota)}, com entrada facilitada de R$ ${formatBRL(valorEntrada)}.`
    : `Temos uma oportunidade no valor de R$ ${formatBRL(valorCota)}.`;

  const rendasLinha = rendasAnual
    ? `renda líquida anual estimada de R$ ${rendasAnual} e renda líquida mensal de R$ ${rendasMensal}`
    : rendasMensal
    ? `renda líquida mensal média de R$ ${rendasMensal}`
    : "renda líquida mensal média de R$ X,XX";

  const linhas = [
    `Oi, [NOME]! Como você está?`,
    ``,
    `Recebemos em nosso sistema que você demonstrou interesse no ${nomeEmpreendimento}. Todos os detalhes estão disponíveis aqui:`,
    ``,
    url,
    ``,
    linhaCota,
    ``,
    `Essa é a oportunidade perfeita para garantir ${rendasLinha}, com a gestão da Seazone!`,
    ``,
    `Pagamento exclusivamente via pix ou parcelamento. Não aceitamos fgts nem carta de crédito.`,
    ``,
    `Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
  ];
  return linhas.join("\n");
}

export async function POST() {
  try {
    const res = await fetch(SHEETS_URL, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return NextResponse.json({ erro: `Erro ao buscar Sheets: ${res.status}` }, { status: 502 });
    }

    const dados: Record<
      string,
      { valorCota?: number; valorEntrada?: number; emFuncionamento?: boolean; url?: string; erro?: string; totalDisponivel?: number }
    > = await res.json();

    const empreendimentos = await db.repescagemEmpreendimento.findMany({
      include: { numeros: true },
    });

    const resultados: {
      nome: string;
      status: "gerado" | "mantido" | "manual" | "erro";
      valorAntigo?: string;
      valorNovo?: string;
      motivo?: string;
    }[] = [];

    for (const emp of empreendimentos) {
      const slugBanco = slugify(emp.nomeEmpreendimento);
      let dado = dados[emp.nomeEmpreendimento];

      if (!dado) {
        const chaveSheets = Object.keys(dados).find((k) => slugify(k) === slugBanco);
        if (chaveSheets) dado = dados[chaveSheets];
      }

      if (!dado || dado.erro) {
        resultados.push({
          nome: emp.nomeEmpreendimento,
          status: "erro",
          motivo: dado?.erro ?? "Não encontrada no Sheets",
        });
        continue;
      }

      if (emp.editadoManualmente) {
        resultados.push({
          nome: emp.nomeEmpreendimento,
          status: "manual",
          motivo: "Editado manualmente — não atualizado",
        });
        continue;
      }

      const valorCota = toNumber(dado.valorCota);
      const valorEntrada = toNumber(dado.valorEntrada);

      if (valorCota === null) {
        resultados.push({
          nome: emp.nomeEmpreendimento,
          status: "erro",
          motivo: "Valor da cota ausente no Sheets",
        });
        continue;
      }

      const textoAtual = emp.textoConteudo ?? "";
      const rendas = extrairRendas(textoAtual);

      const apenasUmaCota = (dado.totalDisponivel ?? 0) === 1;

      const textoNovo = gerarTexto({
        nomeEmpreendimento: emp.nomeEmpreendimento,
        valorCota,
        valorEntrada,
        emFuncionamento: dado.emFuncionamento ?? false,
        url: dado.url ?? "",
        rendasAnual: rendas.anual,
        rendasMensal: rendas.mensal,
        apenasUmaCota,
      });

      await db.repescagemEmpreendimento.update({
        where: { id: emp.id },
        data: {
          textoConteudo: textoNovo,
          dataUltimaAtualizacao: new Date(),
          editadoManualmente: false,
        },
      });

      // Atualizar campos Valor total e Entrada nos números
      const numeroTotal = emp.numeros.find(
        (n) => n.campoNome.toLowerCase().includes("valor") && n.campoNome.toLowerCase().includes("total")
      );
      if (numeroTotal) {
        await db.repescagemNumero.update({
          where: { id: numeroTotal.id },
          data: { valorAtual: `R$ ${formatBRL(valorCota)}` },
        });
      }

      if (valorEntrada !== null && valorEntrada !== valorCota) {
        const numeroEntrada = emp.numeros.find((n) => n.campoNome.toLowerCase().includes("entrada"));
        if (numeroEntrada) {
          await db.repescagemNumero.update({
            where: { id: numeroEntrada.id },
            data: { valorAtual: `R$ ${formatBRL(valorEntrada)}` },
          });
        }
      }

      resultados.push({
        nome: emp.nomeEmpreendimento,
        status: "gerado",
        valorNovo: `R$ ${formatBRL(valorCota)}`,
      });
    }

    revalidatePath("/respescagem");

    return NextResponse.json({
      total: empreendimentos.length,
      gerados: resultados.filter((r) => r.status === "gerado").length,
      mantidos: resultados.filter((r) => r.status === "mantido").length,
      manuais: resultados.filter((r) => r.status === "manual").length,
      erros: resultados.filter((r) => r.status === "erro").length,
      detalhes: resultados,
    });
  } catch (err) {
    console.error("[auditar-repescagem]", err);
    return NextResponse.json({ erro: "Erro interno ao auditar." }, { status: 500 });
  }
}