import Link from "next/link";
import {
  Target,
  FileText,
  Inbox,
  TrendingUp,
  BarChart3,
  Search,
  RefreshCw,
} from "lucide-react";
import { SubCardSearch } from "@/components/sub-card-search";

const subCards = [
  {
    href: "/acompanhamento-de-metas",
    titulo: "Acompanhamento de Metas",
    descricao: "Visualize e acompanhe suas metas trimestrais",
    icone: Target,
    cor: "text-green-600",
  },
  {
    href: "/artefatos-de-consulta",
    titulo: "Artefatos de Consulta",
    descricao: "Cotas, empreendimentos, faróis de criativos e mais",
    icone: Search,
    cor: "text-purple-600",
  },
  {
    href: "/briefings",
    titulo: "Briefings",
    descricao: "Gerencie briefs de campanha com proteção por código",
    icone: FileText,
    cor: "text-amber-600",
  },
  {
    href: "/losts",
    titulo: "Losts",
    descricao:
      "Agrupamento de motivos, criação de conteúdo e registro de disparos",
    icone: Inbox,
    cor: "text-red-600",
  },
  {
    href: "/opps-da-semana",
    titulo: "Opps da Semana",
    descricao:
      "Registro semanal das oportunidades em destaque e textos criados",
    icone: TrendingUp,
    cor: "text-blue-600",
  },
  {
    href: "/respescagem",
    titulo: "Repescagem",
    descricao: "Auditoria de conteúdo de empreendimentos",
    icone: RefreshCw,
    cor: "text-orange-600",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Marketplace Hub
        </h1>
        <p className="text-gray-500">
          Centralizador de tarefas — Product Marketing
        </p>
      </div>

      <SubCardSearch cards={subCards} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subCards.map((card) => {
          const Icon = card.icone;
          return (
            <Link key={card.href} href={card.href}>
              <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-5 cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg bg-gray-50 ${card.cor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {card.titulo}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                      {card.descricao}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
