import { db } from "@/lib/db";
import { ArtefatosClient } from "@/components/artefatos-client";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    return await db.artefatoConfig.findMany({
      orderBy: { criadoEm: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function ArtefatosPage() {
  const artefatos = await getData();
  return <ArtefatosClient artefatos={artefatos} />;
}
