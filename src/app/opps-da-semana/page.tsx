import { db } from "@/lib/db";
import { getOrCreateOppSemana } from "@/lib/actions";
import { OppsClient } from "@/components/opps-client";
import { getAllWeeks } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OppsPage() {
  const allWeeks = getAllWeeks(2025, 52);

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
    const now = new Date();
    const ws = new Date(now);
    ws.setDate(now.getDate() - now.getDay() + 1);
    ws.setHours(0, 0, 0, 0);
    const first = await getOrCreateOppSemana(ws);
    const withItems = await db.oppSemana.findUnique({
      where: { id: first.id },
      include: { items: { orderBy: { criadoEm: "asc" } } },
    });
    return (
      <OppsClient
        semanas={[withItems!]}
      />
    );
  }

  return <OppsClient semanas={validSemanas} />;
}
