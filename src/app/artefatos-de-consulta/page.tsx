"use client";

import { BackButton } from "@/components/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, ShoppingCart, Megaphone, Building2, Image, BarChart, AlertTriangle, Users, TrendingUp, DollarSign } from "lucide-react";

const links = [
  {
    url: "https://marketplacevendas.lovable.app/",
    titulo: "Cotas de Marketplace",
    descricao:
      "Aqui encontramos todas as cotas de marketplace disponíveis, reservadas ou em negociação, além do valor de venda, de entrada, a flexibilidade do parcelamento e o número da cota.",
    icone: ShoppingCart,
  },
  {
    url: "https://alerta-preco-mktplace.netlify.app/",
    titulo: "Farol de Criativos — Obsolescência",
    descricao:
      "Este é o farol de criativos ativos em mídia paga; ele sinaliza caso um criativo esteja ficando obsoleto (exemplo: o valor \"a partir de\" não contempla mais as cotas disponíveis para venda).",
    icone: AlertTriangle,
  },
  {
    url: "https://spotlight-project-manager.lovable.app/",
    titulo: "Spotlight — Projeções e Status de Obras",
    descricao:
      "Neste tem todos os empreendimentos e suas respectivas projeções de faturamento ao ano, além de informações de endereço, diferenciais daquele SPOT e status da obra/entrega dele.",
    icone: Building2,
  },
  {
    url: "https://revendas.seazone.com.br/24595c970b3481318ec8ff86132dd6ef?v=24595c970b34814d9cc7000cada90be0",
    titulo: "Revendas — Fotos e Apresentações",
    descricao:
      "Hub de informações de cada empreendimento; costumo usar para pegar fotos dos empreendimentos de forma fácil e apresentações.",
    icone: Image,
  },
  {
    url: "https://growth-seazone.lovable.app/campaign-analytics",
    titulo: "Growth — Criativos em Campanha",
    descricao:
      "Aqui é onde vejo os criativos ativos em campanha de mídia paga de Marketplace.",
    icone: Megaphone,
  },
  {
    url: "https://saleszone-prod.seazone.dev/mia/erros",
    titulo: "SalesZone — Erros MIA (WhatsApp)",
    descricao:
      "Aqui é onde conferimos quantos erros deu dos envios da MIA (WhatsApp) em disparo de campanhas por frente.",
    icone: AlertTriangle,
  },
  {
    url: "https://seazone-fd92b9.pipedrive.com/progress/insights/report/145311418e24c1b247cdfb337678405e",
    titulo: "Pipedrive — Origem dos WONs Orgânicos",
    descricao:
      "Painel do Pipedrive que a Gabrielly Nogueira montou para acompanharmos origem dos WONs orgânicos.",
    icone: Users,
  },
  {
    url: "https://docs.google.com/spreadsheets/d/1u_CtCo3J85SHqh80gy7x2kye-7wiW0QLUjC9hmrilmc/edit?gid=0#gid=0",
    titulo: "Google Sheets — Preços \"A Partir De\"",
    descricao:
      "Aqui é onde a gente acompanha os valores \"a partir de\" de cada empreendimento.",
    icone: DollarSign,
  },
  {
    url: "https://seazone-insight-hub.lovable.app/",
    titulo: "Insight Hub — Big Numbers SZI/SZS",
    descricao:
      "Aqui são os big numbers de SZI e SZS + cases de sucesso.",
    icone: TrendingUp,
  },
];

export default function ArtefatosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Artefatos de Consulta
        </h1>
        <p className="text-gray-500">
          Links para ferramentas e painéis de consulta do dia a dia
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