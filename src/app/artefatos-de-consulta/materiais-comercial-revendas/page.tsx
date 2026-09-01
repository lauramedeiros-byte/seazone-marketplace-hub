import { db } from "@/lib/db";
import { MateriaisComercialClient } from "@/components/materiais-comercial-client";

export const dynamic = "force-dynamic";

export default async function MateriaisComercialRevendasPage() {
  const materiais = await db.materialComercial.findMany({
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });

  return (
    <MateriaisComercialClient
      materiaisInit={materiais.map((m) => ({
        id: m.id,
        titulo: m.titulo,
        descricao: m.descricao,
        url: m.url,
        interno: m.interno,
      }))}
    />
  );
}
