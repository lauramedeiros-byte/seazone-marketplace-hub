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
import { ExternalLink, ShoppingCart, Megaphone, Building2, Image, BarChart, AlertTriangle, Users, TrendingUp, DollarSign, Search, Star, Layers } from "lucide-react";

const links = [
  {
    url: "https://marketplacevendas.lovable.app/",
    titulo: "Cotas de Marketplace",
    descricao:
      "Todas as cotas disponíveis, reservadas ou em negociação, além do valor de venda, de entrada, a flexibilidade do parcelamento e o número da cota.",
    icone: ShoppingCart,
    cor: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    url: "https://alerta-preco-mktplace.netlify.app/",
    titulo: "Farol de Criativos",
    descricao:
      "Farol de criativos ativos em mídia paga; sinaliza criativos obsoletos (exemplo: valor \"a partir de\" desatualizado).",
    icone: AlertTriangle,
    cor: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    url: "https://spotlight-project-manager.lovable.app/",
    titulo: "Spotlight — Projeções",
    descricao:
      "Todos os empreendimentos com projeções de faturamento, endereço, diferenciais e status da obra/entrega.",
    icone: Building2,
    cor: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    url: "https://revendas.seazone.com.br/24595c970b3481318ec8ff86132dd6ef?v=24595c970b34814d9cc7000cada90be0",
    titulo: "Revendas — Fotos",
    descricao:
      "Hub de informações de empreendimentos; uso principal: pegar fotos e apresentações.",
    icone: Image,
    cor: "bg-pink-50 text-pink-600 border-pink-100",
  },
  {
    grupo: "Growth",
    url: "https://artefatos-growth-seazone.vercel.app/criativos",
    titulo: "Criativos por Campanha",
    descricao: "Quantidade de criativos ativos por campanha",
    icone: Megaphone,
    cor: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    grupo: "Growth",
    url: "https://artefatos-growth-seazone.vercel.app/creative-hub",
    titulo: "Creative Hub",
    descricao: "Estoque de criativos",
    icone: Layers,
    cor: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    url: "https://saleszone-prod.seazone.dev/mia/erros",
    titulo: "SalesZone — Erros MIA",
    descricao:
      "Quantidade de erros nos envios da MIA (WhatsApp) por frente de campanha.",
    icone: AlertTriangle,
    cor: "bg-red-50 text-red-600 border-red-100",
  },
  {
    url: "https://seazone-fd92b9.pipedrive.com/progress/insights/report/145311418e24c1b247cdfb337678405e",
    titulo: "Pipedrive — WONs Orgânicos",
    descricao:
      "Painel da Gabrielly Nogueira: origem dos WONs orgânicos.",
    icone: Users,
    cor: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/1u_CtCo3J85SHqh80gy7x2kye-7wiW0QLUjC9hmrilmc/edit?gid=0#gid=0",
    titulo: "Google Sheets — \"A Partir De\"",
    descricao:
      "Acompanhamento dos valores \"a partir de\" de cada empreendimento.",
    icone: DollarSign,
    cor: "bg-green-50 text-green-600 border-green-100",
  },
  {
    url: "https://seazone-insight-hub.lovable.app/",
    titulo: "Insight Hub — Big Numbers",
    descricao:
      "Big numbers de SZI e SZS + cases de sucesso.",
    icone: TrendingUp,
    cor: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/1M-e-h-UeA3X-PxlDbXlOxn_l8zbJndL9k4_F0Ces-KM/edit?gid=0#gid=0",
    titulo: "Google Sheets — Pontos Fortes",
    descricao:
      "Pontos fortes de marketplace.",
    icone: Star,
    cor: "bg-yellow-50 text-yellow-600 border-yellow-100",
  },
];

export default function ArtefatosPage() {
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

  const grupos = useMemo(() => {
    const map = new Map<string, typeof links>();
    const semGrupo: typeof links = [];
    for (const link of filtrados) {
      if (link.grupo) {
        const existing = map.get(link.grupo) || [];
        existing.push(link);
        map.set(link.grupo, existing);
      } else {
        semGrupo.push(link);
      }
    }
    return { grupos: Array.from(map.entries()), semGrupo };
  }, [filtrados]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Artefatos de Consulta
        </h1>
        <p className="text-gray-500">
          Links para ferramentas e painéis de consulta do dia a dia
        </p>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar artefato..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Grid de 2 colunas */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhum artefato encontrado.</p>
        </div>
      ) : (
        <>
          {/* Blocos agrupados */}
          {grupos.grupos.map(([nomeGrupo, linksGrupo]) => (
            <div key={nomeGrupo} className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                {nomeGrupo}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {linksGrupo.map((link) => {
                  const Icon = link.icone;
                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all h-full border-l-4 border-l-blue-400">
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
          ))}

          {/* Cards sem grupo */}
          {grupos.semGrupo.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {grupos.semGrupo.map((link) => {
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
          )}
        </>
      )}

      {filtrados.length > 0 && filtrados.length < links.length && (
        <p className="text-sm text-gray-400 mt-4 text-center">
          Mostrando {filtrados.length} de {links.length} artefatos
        </p>
      )}
    </div>
  );
}