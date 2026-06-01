import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxvl_WGlrn5-LMuY96EkpAEYsR1CqbtM-jkSZPA79LSBHRQkT2nPO1BvSlnb76oGWTU6w/exec";

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

/**
 * Substitui os valores de preço no texto atual mantendo toda a estrutura.
 * Busca linhas que contenham "R$" e substitui o último valor monetário
 * quando a linha menciona "valor", "entrada", "unidades", etc.
 */
function atualizarTexto(textoAtual: string, params: {
  nomeEmpreendimento: string;
  valorCota: number;
  valorEntrada: number | null;
  emFuncionamento: boolean;
}): string {
  const { nomeEmpreendimento, valorCota, valorEntrada, emFuncionamento } = params;

  let texto = textoAtual;

  // ── 1. Identificar se deve mencionar entrada ─────────────────────────────
  const temEntrada =
    valorEntrada !== null &&
    valorEntrada !== valorCota &&
    valorEntrada > 0;

  // ── 2. Construir a linha de valores ────────────────────────────────────
  const valorCotaStr = `R$ ${formatBRL(valorCota)}`;
  const entradaStr =
    temEntrada
      ? `, com entrada a partir de R$ ${formatBRL(valorEntrada)}`
      : "";

  const novaLinhaValores = `atualmente temos as últimas unidades a partir de ${valorCotaStr}${entradaStr}.`;

  // ── 3. Substituir a linha de valores no texto ───────────────────────────
  // Procura qualquer linha que contenha "atualmente temos" ou "últimas unidades"
  const linhas = texto.split("\n");
  let substituiuValores = false;
  let substituiuOperacao = false;

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const lLower = l.toLowerCase();

    // Substituir linha de valores
    if (!substituiuValores && (lLower.includes("atualmente temos") || lLower.includes("últimas unidades"))) {
      linhas[i] = novaLinhaValores;
      substituiuValores = true;
      continue;
    }

    // Tratar "Em operação" (coluna S = Em funcionamento)
    const emOperacaoTexto = "O empreendimento já está em operação, e";

    if (lLower.includes("em operação") || lLower.includes("funcionamento")) {
      if (!emFuncionamento) {
        // Remove a menção de operação
        linhas[i] = l.replace(/O empreendimento já está em operação,?\s*e\s*/i, "");
      }
      substituiuOperacao = true;
      continue;
    }

    if (emFuncionamento && !substituiuOperacao) {
      // A linha anterior contém "atualmente temos" — inserir menção de operação antes
      if (lLower.includes("atualmente temos") && !lLower.includes("em operação")) {
        linhas[i] = `${emOperacaoTexto} ${l.toLowerCase().replace(/^e /, "")}`;
        substituiuOperacao = true;
        substituiuValores = true; // já substituiu na mesma linha
      }
    }
  }

  // Se não encontrou "atualmente temos" para substituir, inserir antes da linha de rendas
  if (!substituiuValores) {
    const idxRendas = linhas.findIndex((l) =>
      l.toLowerCase().includes("oportunidade perfeita") ||
      l.toLowerCase().includes("renda líquida")
    );
    if (idxRendas > 0) {
      linhas.splice(idxRendas - 1, 0, novaLinhaValores);
    } else {
      texto += `\n\n${novaLinhaValores}`;
    }
  }

  return linhas.join("\n");
}

export async function POST() {
  try {
    // 1. Buscar dados do Sheets
    const res = await fetch(SHEETS_URL, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { erro: `Erro ao buscar Sheets: ${res.status}` },
        { status: 502 }
      );
    }

    const dados: Record<
      string,
      {
        valorCota?: number;
        valorEntrada?: number;
        emFuncionamento?: boolean;
        url?: string;
        erro?: string;
      }
    > = await res.json();

    // 2. Buscar empreendimentos do banco
    const empreendimentos = await db.repescagemEmpreendimento.findMany({
      include: { numeros: true },
    });

    const resultados: {
      nome: string;
      status: "ok" | "ignorada" | "erro";
      motivo?: string;
    }[] = [];

    for (const emp of empreendimentos) {
      const nomeBanco = emp.nomeEmpreendimento;
      const slugBanco = slugify(nomeBanco);

      let dado = dados[nomeBanco];

      if (!dado) {
        const chaveSheets = Object.keys(dados).find(
          (k) => slugify(k) === slugBanco
        );
        if (chaveSheets) dado = dados[chaveSheets];
      }

      if (!dado || dado.erro) {
        resultados.push({
          nome: nomeBanco,
          status: "ignorada",
          motivo: dado?.erro ?? "Não encontrada no Sheets",
        });
        continue;
      }

      const valorCota = toNumber(dado.valorCota);
      const valorEntrada = toNumber(dado.valorEntrada);

      if (valorCota === null) {
        resultados.push({
          nome: nomeBanco,
          status: "erro",
          motivo: "Valor da cota ausente no Sheets",
        });
        continue;
      }

      const textoAntigo = emp.textoConteudo ?? "";
      const textoNovo = atualizarTexto(textoAntigo, {
        nomeEmpreendimento: nomeBanco,
        valorCota,
        valorEntrada,
        emFuncionamento: dado.emFuncionamento ?? false,
      });

      // 3. Atualizar no banco
      await db.repescagemEmpreendimento.update({
        where: { id: emp.id },
        data: {
          textoConteudo: textoNovo,
          dataUltimaAtualizacao: new Date(),
        },
      });

      // Atualizar campos "Valor total" e "Entrada" nos números, se existirem
      const numeroTotal = emp.numeros.find(
        (n) =>
          n.campoNome.toLowerCase().includes("valor") &&
          n.campoNome.toLowerCase().includes("total")
      );
      if (numeroTotal) {
        await db.repescagemNumero.update({
          where: { id: numeroTotal.id },
          data: { valorAtual: `R$ ${formatBRL(valorCota)}` },
        });
      }

      if (valorEntrada !== null && valorEntrada !== valorCota) {
        const numeroEntrada = emp.numeros.find((n) =>
          n.campoNome.toLowerCase().includes("entrada")
        );
        if (numeroEntrada) {
          await db.repescagemNumero.update({
            where: { id: numeroEntrada.id },
            data: { valorAtual: `R$ ${formatBRL(valorEntrada)}` },
          });
        }
      }

      resultados.push({ nome: nomeBanco, status: "ok" });
    }

    revalidatePath("/respescagem");

    const atualizados = resultados.filter((r) => r.status === "ok").length;
    const ignorados = resultados.filter((r) => r.status === "ignorada").length;
    const erros = resultados.filter((r) => r.status === "erro").length;

    return NextResponse.json({
      total: empreendimentos.length,
      atualizados,
      ignorados,
      erros,
      detalhes: resultados,
    });
  } catch (err) {
    console.error("[auditar-repescagem]", err);
    return NextResponse.json(
      { erro: "Erro interno ao auditar." },
      { status: 500 }
    );
  }
}