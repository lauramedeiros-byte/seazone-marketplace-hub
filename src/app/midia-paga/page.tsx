import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, ExternalLink } from "lucide-react";

const subcards = [
  {
    href: "/midia-paga/analises-claude",
    titulo: "Análises Claude",
    descricao: "Registro das análises de mídia paga rodadas no Claude, organizadas por semana.",
    icone: BrainCircuit,
    cor: "bg-violet-50 text-violet-600",
    bordaCor: "border-l-violet-400",
    externo: false,
  },
];

export default function MidiaPagaPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Análise de Mídia Paga
        </h1>
        <p className="text-gray-500">
          Análise e acompanhamento de campanhas de mídia paga
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subcards.map((card) => {
          const Icon = card.icone;
          const inner = (
            <Card className={`hover:shadow-md hover:-translate-y-0.5 transition-all h-full border-l-4 ${card.bordaCor}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg shrink-0 ${card.cor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {card.titulo}
                      {card.externo && <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 leading-relaxed ml-12">{card.descricao}</p>
              </CardContent>
            </Card>
          );

          return card.externo ? (
            <a key={card.href} href={card.href} target="_blank" rel="noopener noreferrer" className="block group">
              {inner}
            </a>
          ) : (
            <Link key={card.href} href={card.href} className="block group">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
