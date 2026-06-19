import { BackButton } from "@/components/back-button";
import { db } from "@/lib/db";
import { AnalisesClaudeClient } from "@/components/analises-claude-client";
import { BrainCircuit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalisesClaudePage() {
  const analises = await db.analiseClaude.findMany({
    orderBy: { dataAnalise: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-violet-100">
            <BrainCircuit className="w-5 h-5 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Análises Claude</h1>
        </div>
        <p className="text-gray-500 ml-14">
          Registro das análises de mídia paga rodadas no Claude — organizadas por semana
        </p>
      </div>

      <AnalisesClaudeClient inicial={JSON.parse(JSON.stringify(analises))} />
    </div>
  );
}
