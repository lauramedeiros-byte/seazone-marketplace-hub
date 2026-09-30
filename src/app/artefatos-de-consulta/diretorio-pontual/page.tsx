import { db } from "@/lib/db";
import { DiretorioPontualClient } from "@/components/diretorio-pontual-client";

export const dynamic = "force-dynamic";

export default async function DiretorioPontualPage() {
  const itens = await db.diretorioPontual.findMany({
    orderBy: [{ ano: "desc" }, { criadoEm: "desc" }],
  });

  return (
    <DiretorioPontualClient
      itensInit={itens.map((i) => ({
        id: i.id,
        ano: i.ano,
        titulo: i.titulo,
        url: i.url,
        nota: i.nota,
      }))}
    />
  );
}
