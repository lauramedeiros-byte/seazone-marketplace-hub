"use client";

import { useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, ShoppingCart, Megaphone, Building2, Image, Users, TrendingUp, Search, Layers, Send, MessageSquare, Activity, CalendarDays, Presentation, Sparkles, ArrowRight, Link2, BarChart3, Archive } from "lucide-react";

type Link = {
  url: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  cor: string;
  grupo: string;
  interno?: boolean;
};

const links: Link[] = [
  // Atalhos (topo, ícones discretos)
  {
    grupo: "atalho",
    url: "https://marketing-hub-ruddy.vercel.app/social-midia/calendario-seazone",
    titulo: "Calendário de postagens de social",
    descricao:
      "Calendário de postagens de social media da Seazone — planejamento e agenda de publicações.",
    icone: CalendarDays,
    cor: "text-fuchsia-500",
  },
  {
    grupo: "atalho",
    url: "https://seazone-social-hub.vercel.app/utm",
    titulo: "Gerador de UTM",
    descricao:
      "Cria os parâmetros UTM que tornam um link nosso rastreável.",
    icone: Link2,
    cor: "text-sky-500",
  },

  // Use para montar conteúdos de Marketplace
  {
    grupo: "conteudos",
    url: "https://marketplacevendas.lovable.app/",
    titulo: "Cotas de Marketplace",
    descricao:
      "Todas as cotas disponíveis, reservadas ou em negociação, além do valor de venda, de entrada, a flexibilidade do parcelamento e o número da cota.",
    icone: ShoppingCart,
    cor: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    grupo: "conteudos",
    url: "https://sapron.com.br/parceiros/revendas",
    titulo: "Informações dos empreendimentos",
    descricao:
      "Aqui você encontra dados de empreendimento como: diferenciais, avanço da obra, fotos, ficha técnica completa e mais.",
    icone: Building2,
    cor: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    grupo: "conteudos",
    url: "https://revendas.seazone.com.br/24595c970b3481318ec8ff86132dd6ef?v=24595c970b34814d9cc7000cada90be0",
    titulo: "Revendas — Fotos",
    descricao:
      "Hub de informações de empreendimentos; uso principal: pegar fotos e apresentações.",
    icone: Image,
    cor: "bg-pink-50 text-pink-600 border-pink-100",
  },
  {
    grupo: "conteudos",
    url: "https://big-numbers.seazone.dev/",
    titulo: "Insight Hub — Big Numbers",
    descricao:
      "Big numbers de SZI e SZS + cases de sucesso.",
    icone: TrendingUp,
    cor: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    grupo: "conteudos",
    url: "https://diretorio.seazone.com.br/",
    titulo: "Diretório — Apresentações",
    descricao:
      "Onde ficam todas as apresentações da empresa, organizadas por frente.",
    icone: Presentation,
    cor: "bg-sky-50 text-sky-600 border-sky-100",
  },
  {
    grupo: "conteudos",
    interno: true,
    url: "/artefatos-de-consulta/criativos-que-funcionaram",
    titulo: "Criativos que funcionaram no passado",
    descricao:
      "Aqui você encontra o criativo + o resultado que ele trouxe no passado, para ajudar a criar novas artes.",
    icone: Sparkles,
    cor: "bg-violet-100 text-violet-700 border-violet-200",
  },

  // Time comercial — Revendas (material deles, não acompanhamento de marketing)
  {
    grupo: "comercial",
    interno: true,
    url: "/artefatos-de-consulta/materiais-comercial-revendas",
    titulo: "Materiais comercial Revendas",
    descricao:
      "Material de apoio do time comercial: o que cada criativo no ar promete e o que sondar do lead. Editável — dá para adicionar e remover materiais.",
    icone: Megaphone,
    cor: "bg-orange-100 text-orange-700 border-orange-200",
  },

  // Growth & Criativos
  {
    grupo: "growth",
    url: "https://artefatos-growth-seazone.vercel.app/resultados",
    titulo: "Resultados de Campanhas e Criativos",
    descricao:
      "Resultado das campanhas e dos criativos, ativos ou não.",
    icone: BarChart3,
    cor: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    grupo: "growth",
    url: "https://artefatos-growth-seazone.vercel.app/criativos",
    titulo: "Criativos por Campanha",
    descricao: "Quantidade de criativos ativos por campanha",
    icone: Megaphone,
    cor: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    grupo: "growth",
    url: "https://artefatos-growth-seazone.vercel.app/creative-hub",
    titulo: "Creative Hub",
    descricao: "Estoque de criativos",
    icone: Layers,
    cor: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    grupo: "growth",
    url: "https://artefatos-growth-seazone.vercel.app/creative-library",
    titulo: "Creative Library",
    descricao: "Busca criativo pelo ID do Pipedrive para visualizar o conteúdo do vídeo ou imagem.",
    icone: Search,
    cor: "bg-blue-50 text-blue-600 border-blue-100",
  },

  // Disparos (base interna)
  {
    grupo: "disparos",
    url: "https://plataforma.sia.zone/login",
    titulo: "SIA — Conversas dos disparos",
    descricao:
      "Para ver as conversas que recebemos dos disparos.",
    icone: MessageSquare,
    cor: "bg-teal-50 text-teal-600 border-teal-100",
  },

  // Acompanhamento de resultados
  {
    grupo: "resultados",
    url: "https://disparos-base-interna.vercel.app/",
    titulo: "Disparos — Base Interna",
    descricao:
      "Performance dos disparos de base interna de marketplace: quais geram mais SQL e oportunidades, para guiar a estratégia de disparos.",
    icone: Send,
    cor: "bg-teal-50 text-teal-600 border-teal-100",
  },
  {
    grupo: "resultados",
    url: "https://seazone-fd92b9.pipedrive.com/progress/insights/report/145311418e24c1b247cdfb337678405e",
    titulo: "Pipedrive — WONs Orgânicos",
    descricao:
      "Painel da Gabrielly Nogueira: origem dos WONs orgânicos.",
    icone: Users,
    cor: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
];

const DIRETORIO_PONTUAL = "/artefatos-de-consulta/diretorio-pontual";

const GRUPOS: Record<
  string,
  { titulo: string; icone: LucideIcon; box: string; head: string; borda: string; count: string }
> = {
  conteudos: {
    titulo: "Use para montar conteúdos de Marketplace",
    icone: Building2,
    box: "bg-violet-50/60 border-violet-100",
    head: "text-violet-600",
    borda: "border-l-violet-400",
    count: "text-violet-400",
  },
  comercial: {
    titulo: "Time comercial — Revendas",
    icone: Megaphone,
    box: "bg-orange-50/60 border-orange-200",
    head: "text-orange-600",
    borda: "border-l-orange-400",
    count: "text-orange-400",
  },
  growth: {
    titulo: "Growth & Criativos",
    icone: TrendingUp,
    box: "bg-blue-50/60 border-blue-100",
    head: "text-blue-600",
    borda: "border-l-blue-400",
    count: "text-blue-400",
  },
  disparos: {
    titulo: "Disparos (base interna)",
    icone: Send,
    box: "bg-teal-50/60 border-teal-100",
    head: "text-teal-600",
    borda: "border-l-teal-400",
    count: "text-teal-400",
  },
  resultados: {
    titulo: "Acompanhamento de resultados",
    icone: Activity,
    box: "bg-fuchsia-50/60 border-fuchsia-100",
    head: "text-fuchsia-600",
    borda: "border-l-fuchsia-400",
    count: "text-fuchsia-400",
  },
};

const ORDEM_GRUPOS = ["conteudos", "comercial", "growth", "disparos", "resultados"];

function CardLink({ link, borda }: { link: Link; borda: string }) {
  const Icon = link.icone;
  const linkProps = link.interno
    ? {}
    : { target: "_blank", rel: "noopener noreferrer" };
  return (
    <a href={link.url} {...linkProps} className="block group">
      <Card className={`hover:shadow-md hover:-translate-y-0.5 transition-all h-full border-l-4 bg-white ${borda}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg shrink-0 ${link.cor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {link.titulo}
                {link.interno ? (
                  <ArrowRight className={`w-3 h-3 transition-colors shrink-0 ${link.grupo === "comercial" ? "text-orange-400 group-hover:text-orange-600" : "text-violet-400 group-hover:text-violet-600"}`} />
                ) : (
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
                )}
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
}

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

  const secoes = useMemo(() => {
    const atalhos = filtrados.filter((l) => l.grupo === "atalho");
    const grupos = ORDEM_GRUPOS.map((chave) => ({
      chave,
      cfg: GRUPOS[chave],
      itens: filtrados.filter((l) => l.grupo === chave),
    })).filter((g) => g.itens.length > 0);
    return { atalhos, grupos };
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

      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhum artefato encontrado.</p>
        </div>
      ) : (
        <>
          {/* Atalhos discretos (topo) */}
          {secoes.atalhos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {secoes.atalhos.map((link) => {
                const Icon = link.icone;
                return (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.descricao}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm transition-all"
                  >
                    <Icon className={`w-3.5 h-3.5 ${link.cor}`} />
                    {link.titulo}
                  </a>
                );
              })}
            </div>
          )}

          {/* Blocos agrupados */}
          {secoes.grupos.map(({ chave, cfg, itens }) => {
            const HeadIcon = cfg.icone;
            return (
              <div key={chave} className={`mb-6 border rounded-xl p-4 ${cfg.box}`}>
                <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${cfg.head}`}>
                  <HeadIcon className="w-3.5 h-3.5" />
                  {cfg.titulo}
                  <span className={`ml-auto font-normal normal-case tracking-normal text-xs ${cfg.count}`}>
                    {itens.length} {itens.length === 1 ? "artefato" : "artefatos"}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {itens.map((link) => (
                    <CardLink key={link.url} link={link} borda={cfg.borda} />
                  ))}
                </div>
              </div>
            );
          })}

        </>
      )}

      {filtrados.length > 0 && filtrados.length < links.length && (
        <p className="text-sm text-gray-400 mt-4 text-center">
          Mostrando {filtrados.length} de {links.length} artefatos
        </p>
      )}

      {/* Diretório de coisas pontuais — sempre no final, fora da busca */}
      <a href={DIRETORIO_PONTUAL} className="block group mt-8 pt-5 border-t border-gray-100">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 hover:bg-white hover:shadow-sm transition-all">
          <div className="p-2 rounded-lg shrink-0 bg-slate-100 text-slate-600">
            <Archive className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800">
              Diretório de coisas pontuais
            </div>
            <p className="text-xs text-gray-500">
              O que não tem onde encaixar, mas precisa ficar guardado — pastas por ano.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
        </div>
      </a>
    </div>
  );
}
