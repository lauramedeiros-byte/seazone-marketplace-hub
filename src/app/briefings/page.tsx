import { db } from "@/lib/db";
import { BriefingsClient } from "@/components/briefings-client";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    return await db.briefing.findMany({
      orderBy: { criadoEm: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function BriefingsPage() {
  const briefings = await getData();
  return <BriefingsClient briefings={briefings} />;
}
