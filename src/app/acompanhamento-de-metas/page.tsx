"use client";

import { useState, useMemo } from "react";
import { BackButton } from "@/components/back-button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, BarChart3, LineChart, Search } from "lucide-react";

const links = [
  {
    url: "https://mission-control.seazone.dev/?pipeline=funil_mktp_direto",
    titulo: "Mission Control — Farol do Funil",
    descricao:
      "Aqui vemos o farol do funil de marketplace e outras frentes da Seazone, além da meta.",
    icone: BarChart3,
    cor: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    url: "https://saleszone-prod.seazone.dev/",
    titulo: "SalesZone Pro — Funil Detalhado",
    descricao:
      "Acompanhamento do funil de marketplace no detalhe: MQL, SQL, OPP e WON por dia, por empreendimento e por canal (mídia paga ou base interna).",
    icone: LineChart,
    cor: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
];

export default function MetasPage() {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    if (!busca.trim()) return links;
    const q = busca.toLowerCase();
    return links.filter(
      (l) =>
        l.titulo.toLowerCase().includes(q) ||
        l.descricao.toLowerCase().includes(q)
    );
  }, [busca]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Acompanhamento de Metas
        </h1>
        <p className="text-gray-500">
          Links para os painéis de acompanhamento do funil de marketplace
        </p>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar painel..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Grid de 2 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtrados.map((link) => {
          const Icon = link.icone;
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all h-full border-l-4 border-l-transparent hover:border-l-4">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 ${link.cor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {link.titulo}
                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed ml-12">
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