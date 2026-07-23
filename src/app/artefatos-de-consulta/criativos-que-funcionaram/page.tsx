import { db } from "@/lib/db";
import { CriativosPassadoClient } from "@/components/criativos-passado-client";

export const dynamic = "force-dynamic";

export default async function CriativosQueFuncionaramPage() {
  const pastas = await db.criativoPastaEmp.findMany({
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
    include: {
      registros: {
        orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
      },
    },
  });

  return <CriativosPassadoClient pastasInit={pastas} />;
}
