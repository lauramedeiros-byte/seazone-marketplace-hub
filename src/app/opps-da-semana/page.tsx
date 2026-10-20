import { db } from "@/lib/db";
import { getOrCreateOppSemana } from "@/lib/actions";
import { OppsClient } from "@/components/opps-client";
import { getAllWeeks } from "@/lib/utils";
import { montarDesempenho } from "@/lib/opps-desempenho";

export const dynamic = "force-dynamic";

export default async function OppsPage() {
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1);
  currentWeekStart.setHours(0, 0, 0, 0);

  const allWeeks = getAllWeeks(2025, 52);

  const [passoRow, calRow] = await Promise.all([
    db.oppsPassoAPasso.findUnique({ where: { id: "singleton" } }),
    db.oppsCalendarioSemana.findUnique({ where: { id: "singleton" } }),
  ]);
  const passoInicial = (passoRow?.conteudoJson as unknown) ?? null;
  const calendarioInicial = (calRow?.conteudoJson as unknown) ?? null;

  // Aba "Desempenho" + catálogo vivo para o "esfriando" (dados do cron sync-opps-desempenho)
  const [todosItens, campanhas, cotas, catalogo] = await Promise.all([
    db.oppItem.findMany({ include: { semana: { select: { weekStart: true } } } }),
    db.oppDesempenho.findMany(),
    db.oppCotaStatus.findMany(),
    db.revendaEmpreendimento.findMany(),
  ]);
  const desempenho = campanhas.length
    ? montarDesempenho(
        todosItens.map((i) => ({ ...i, weekStart: i.semana.weekStart })),
        campanhas,
        cotas
      )
    : null;
  const ultimaAtualizacao = campanhas.reduce<Date | null>((m, c) => (!m || c.atualizadoEm > m ? c.atualizadoEm : m), null);
  const desempenhoAtualizadoEm = ultimaAtualizacao
    ? ultimaAtualizacao.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })
    : null;
  const NOVO_DIAS = 30;
  const catalogoRevenda = catalogo.map((e) => ({
    nome: e.nome,
    novo: Date.now() - e.primeiraVez.getTime() < NOVO_DIAS * 24 * 60 * 60 * 1000,
  }));
  const extras = { desempenho, desempenhoAtualizadoEm, catalogoRevenda };

  const semanas = await Promise.all(
    allWeeks
      .slice(-26)
      .reverse()
      .map(async (w) => {
        const sw = await db.oppSemana.findUnique({
          where: { weekStart: w },
        });
        if (sw) {
          return db.oppSemana.findUnique({
            where: { weekStart: w },
            include: { items: { orderBy: { criadoEm: "asc" } } },
          });
        }
        return null;
      })
  );

  const validSemanas = semanas.filter(Boolean) as NonNullable<typeof semanas[number]>[];

  if (validSemanas.length === 0) {
    const first = await getOrCreateOppSemana(currentWeekStart);
    const withItems = await db.oppSemana.findUnique({
      where: { id: first.id },
      include: { items: { orderBy: { criadoEm: "asc" } } },
    });
    return (
      <OppsClient
        semanas={[withItems!]}
        passoInicial={passoInicial}
        calendarioInicial={calendarioInicial}
        {...extras}
      />
    );
  }

  const hasCurrentWeek = validSemanas.some(s => {
    const sDate = new Date(s.weekStart);
    return sDate.getTime() === currentWeekStart.getTime();
  });

  if (!hasCurrentWeek) {
    const currentSemana = await getOrCreateOppSemana(currentWeekStart);
    const withItems = await db.oppSemana.findUnique({
      where: { id: currentSemana.id },
      include: { items: { orderBy: { criadoEm: "asc" } } },
    });
    validSemanas.unshift(withItems!);
  }

  return <OppsClient semanas={validSemanas} passoInicial={passoInicial} calendarioInicial={calendarioInicial} {...extras} />;
}
