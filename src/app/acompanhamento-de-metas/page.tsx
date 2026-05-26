"use client";

import { BackButton } from "@/components/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, BarChart3, LineChart } from "lucide-react";

const links = [
  {
    url: "https://mission-control.seazone.dev/?pipeline=funil_mktp_direto",
    titulo: "Mission Control — Farol do Funil",
    descricao:
      "Aqui vemos o farol do funil de marketplace e outras frentes da Seazone, além da meta.",
    icone: BarChart3,
  },
  {
    url: "https://saleszone-prod.seazone.dev/",
    titulo: "SalesZone Pro — Funil por Detalhamento",
    descricao:
      "Aqui é onde acompanhamos o funil de marketplace no detalhe, vendo quantos MQL, SQL, OPP e WON geramos por dia, por empreendimento, e por canal (mídia paga ou base interna).",
    icone: LineChart,
  },
];

export default function MetasPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Acompanhamento de Metas
        </h1>
        <p className="text-gray-500">
          Links para os painéis de acompanhamento do funil de marketplace
        </p>
      </div>

      <div className="space-y-4">
        {links.map((link) => {
          const Icon = link.icone;
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="hover:border-blue-300 hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {link.titulo}
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed ml-12">
                    {link.descricao}
                  </CardDescription>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}