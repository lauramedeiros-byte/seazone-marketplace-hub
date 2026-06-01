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

function parseValor(texto: string): { cota: number | null; entrada: number | null } {
  // Extrai valores monetários do texto (R$ 999.999,99 ou R$ 999999,99)
  const matches = texto.match(/R\$\s*([\d\.]+),(\d{2})/g);
  if (!matches || matches.length === 0) return { cota: null, entrada: null };

  const vals = matches.map((m) => {
    const n = parseFloat(m.replace(/R\$\s*/g, "").replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }).filter((v): v is number => v !== null);

  // Primeira menção de "unidades" = valor da cota
  // Última menção (se >1) = valor da entrada
  const entradaIdx = vals.length > 1 ? vals.length - 1 : 0;
  return { cota: vals[0] ?? null, entrada: vals.length > 1 ? vals[entradaIdx] ?? null : null };
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

function atualizarTexto(
  textoAtual: string,
  params: {
    valorCota: number;
    valorEntrada: number | null;
    emFuncionamento: boolean;
  }
): { texto: string; alterado: boolean } {
  const { valorCota, valorEntrada, emFuncionamento } = params;

  const oldVals = parseValor(textoAtual);

  // Se os valores já batem exatamente, não precisa mudar nada
  const precisaAtualizar =
    oldVals.cota !== valorCota ||
    oldVals.entrada !== valorEntrada ||
    emFuncionamento !== textoAtual.toLowerCase().includes("em operação");

  if (!precisaAtualizar) {
    return { texto: textoAtual, alterado: false };
  }

  const temEntrada =
    valorEntrada !== null && valorEntrada !== valorCota && valorEntrada > 0;

  const valorCotaStr = `R$ ${formatBRL(valorCota)}`;
  const entradaStr =
    temEntrada
      ? `, com entrada a partir de R$ ${formatBRL(valorEntrada)}`
      : "";

  const novaLinhaValores = `atualmente temos as últimas unidades a partir de ${valorCotaStr}${entradaStr}.`;

  const linhas = textoAtual.split("\n");
  let substituiuValores = false;
  let substituiuOperacao = false;
  const emOperacaoTexto = "O empreendimento já está em operação, e";

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const lLower = l.toLowerCase();

    if (
      !substituiuValores &&
      (lLower.includes("atualmente temos") || lLower.includes("últimas unidades"))
    ) {
      linhas[i] = novaLinhaValores;
      substituiuValores = true;
      continue;
    }

    if (lLower.includes("em operação") || lLower.includes("funcionamento")) {
      if (!emFuncionamento) {
        linhas[i] = l.replace(/O empreendimento já está em operação,?\s*e\s*/i, "");
      }
      substituiuOperacao = true;
      continue;
    }

    if (emFuncionamento && !substituiuOperacao && lLower.includes("atualmente temos") && !lLower.includes("em operação")) {
      linhas[i] = `${emOperacaoTexto} ${l.toLowerCase().replace(/^e /, "")}`;
      substituiuValores = true;
      substituiuOperacao = true;
    }
  }

  if (!substituiuValores) {
    const idxRendas = linhas.findIndex((l) =>
      l.toLowerCase().includes("oportunidade perfeita") ||
      l.toLowerCase().includes("renda líquida")
    );
    if (idxRendas > 0) {
      linhas.splice(idxRendas - 1, 0, novaLinhaValores);
    } else {
      return { texto: textoAtual + `\n\n${novaLinhaValores}`, alterado: true };
    }
  }

  return { texto: linhas.join("\n"), alterado: true };
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
      { valorCota?: number; valorEntrada?: number; emFuncionamento?: boolean; url?: string; erro?: string }
    > = await res.json();

    const empreendimentos = await db.repescagemEmpreendimento.findMany({ include: { numeros: true } });

    const resultados: {
      nome: string;
      status: "alterado" | "mantido" | "erro";
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

      const { texto: textoNovo, alterado } = atualizarTexto(emp.textoConteudo ?? "", {
        valorCota,
        valorEntrada,
        emFuncionamento: dado.emFuncionamento ?? false,
      });

      const valorCotaAntigo = parseValor(emp.textoConteudo ?? "").cota;

      await db.repescagemEmpreendimento.update({
        where: { id: emp.id },
        data: {
          textoConteudo: textoNovo,
          dataUltimaAtualizacao: new Date(),
        },
      });

      // Atualizar campo "Valor total" nos números, se existir
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
        status: alterado ? "alterado" : "mantido",
        valorAntigo: valorCotaAntigo !== null ? `R$ ${formatBRL(valorCotaAntigo)}` : undefined,
        valorNovo: `R$ ${formatBRL(valorCota)}`,
      });
    }

    revalidatePath("/respescagem");

    return NextResponse.json({
      total: empreendimentos.length,
      alterados: resultados.filter((r) => r.status === "alterado").length,
      mantidos: resultados.filter((r) => r.status === "mantido").length,
      erros: resultados.filter((r) => r.status === "erro").length,
      detalhes: resultados,
    });
  } catch (err) {
    console.error("[auditar-repescagem]", err);
    return NextResponse.json({ erro: "Erro interno ao auditar." }, { status: 500 });
  }
}