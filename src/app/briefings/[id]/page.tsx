import { db } from "@/lib/db";
import { BriefingDetailClient } from "@/components/briefing-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getData(id: string) {
  try {
    return await db.briefing.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function BriefingDetailPage({ params }: Props) {
  const { id } = await params;
  const briefing = await getData(id);
  return <BriefingDetailClient briefing={briefing} />;
}
