import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ExternalLink,
  UploadCloud,
  MessageSquareText,
  ClipboardList,
  MapPin,
  DollarSign,
  CalendarClock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Ban,
  FileCheck2,
  ImageIcon,
} from "lucide-react";

const dadosNecessarios = [
  {
    icone: ClipboardList,
    titulo: "Nome do empreendimento",
  },
  {
    icone: MapPin,
    titulo: "Localização",
    descricao:
      "Rua/cidade/estado e a localização dentro da cidade — do que fica perto. Tudo isso é atrativo na hora de montar roteiros e conteúdos.",
  },
  {
    icone: DollarSign,
    titulo: "Valor do ticket (\"a partir de\")",
    descricao:
      "Use um valor MÉDIO, para o criativo não ficar obsoleto rápido. Garanta que dá pra negociar 3-4 cotas com valor abaixo, e que existam 1-2 cotas acima não muito distantes do valor divulgado.",
  },
  {
    icone: CalendarClock,
    titulo: "Data de entrega",
    descricao: "Se já foi entregue, ou se está com entrega próxima.",
  },
  {
    icone: Sparkles,
    titulo: "Atrativos",
    descricao:
      "Vista mar, quantos metros da praia, rooftop com piscina aquecida, minimarket, proximidade de algum atrativo conhecido, informações sobre a cidade.",
  },
  {
    icone: TrendingUp,
    titulo: "Projeção de rentabilidade",
    descricao: "Anual e mensal.",
  },
];

const palavrasTravadas = [
  "unidade",
  "imóvel",
  "apartamento",
  "studio",
  "(e plurais)",
];

const substituirPor = [
  "a cota",
  "o investimento",
  "a oportunidade",
  "o empreendimento",
  "o SPOT",
  "o ativo",
];

const obrigatorios = [
  "Logo da Seazone e do SPOT desde o início",
  "Localização do SPOT (cidade + estado — ex: Florianópolis - Santa Catarina)",
  "Disclaimer padrão no final de cada criação",
  "CTA",
];

export default function BriefingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Briefings</h1>
        <p className="text-gray-500">
          Racional de como montar um briefing e artefato central de briefings da Seazone
        </p>
      </div>

      {/* Card de destaque: artefato central */}
      <a
        href="https://site-seven-indol-47.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="block group mb-8"
      >
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Artefato de Briefings — todas as frentes da Seazone
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                É aqui que você deve entrar para subir o link do docx com o briefing. Esse é um artefato onde concentramos os briefings de todas as frentes da Seazone.
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0">
              Abrir
            </Button>
          </CardContent>
        </Card>
      </a>

      {/* Racional: como fazer um briefing */}
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900">Como fazer um briefing</h2>
        <p className="text-sm text-gray-500">Passo a passo, do pedido na IA até a publicação no artefato</p>
      </div>

      <div className="relative pl-8 mt-4 space-y-6 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {/* Passo 1 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">1</div>
          <Card className="border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-blue-600" />
                Abra o Claude Chat ou o Claude Cowork
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <p>
                Use a skill <code className="px-1 py-0.5 rounded bg-gray-100 text-gray-800 font-mono">/briefing-spot-seazone</code> para gerar o briefing. Ela oferece pelo menos duas estruturas, cada uma com cerca de 5 variações — peça menos estruturas/variações se o briefing for mais pontual.
              </p>
              <p>
                Informe também o <strong>formato</strong> desejado: estáticos, vídeo narrado, vídeo apresentadora ou disruptivo. Cada formato já tem uma quantidade de estruturas e variações pré-programada, mas dá pra personalizar no pedido.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Passo 2 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">2</div>
          <Card className="border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                Forneça os dados do empreendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dadosNecessarios.map((d) => {
                  const Icon = d.icone;
                  return (
                    <div key={d.titulo} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <Icon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{d.titulo}</p>
                        {d.descricao && (
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{d.descricao}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Lista pode crescer conforme novos critérios surgirem.</p>
            </CardContent>
          </Card>
        </div>

        {/* Passo 3 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">3</div>
          <Card className="border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                Revise o roteiro gerado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 leading-relaxed">
              Passe o roteiro pela skill <code className="px-1 py-0.5 rounded bg-gray-100 text-gray-800 font-mono">/revisor-roteiro-seazone</code> para revisar o que a IA criou e apontar ajustes importantes de palavras e construção.
            </CardContent>
          </Card>
        </div>

        {/* Passo 4 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center">4</div>
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ban className="w-4 h-4 text-amber-600" />
                Garanta que nenhum termo proibido foi usado
              </CardTitle>
              <CardDescription className="text-xs">
                Cole esse texto de regras na IA antes/durante a revisão (válido para Marketplace e SZI/Lançamentos)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-3 leading-relaxed">
              <div>
                <p className="font-semibold text-gray-800 mb-1">Palavras travadas (nunca usar):</p>
                <div className="flex flex-wrap gap-1.5">
                  {palavrasTravadas.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[11px]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Substituir por:</p>
                <div className="flex flex-wrap gap-1.5">
                  {substituirPor.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <p>
                <strong>Sensível ao contexto:</strong> evite "renda passiva" — troque por renda futura, renda com aluguel por temporada / short stay / locação de temporada / Airbnb.
              </p>
              <p>
                <strong>Disclaimer obrigatório:</strong> sempre que ofertar empreendimento (SPOT) ou cota, incluir "*Não aceitamos FGTS e carta de crédito."
              </p>
              <p>
                <strong>Dados:</strong> nunca inventar números. Se o texto tiver muitos dados da região do SPOT, sinalizar para conferir as fontes/links.
              </p>
              <p>
                <strong>Tom (regra geral):</strong> formal mas não engessado, fluidez e coesão entre frases, sem gírias regionais, palavras simples.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Passo 5 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">5</div>
          <Card className="border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                Gere o docx para conferência
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 leading-relaxed">
              Peça para a IA gerar um docx com tudo, para você conferir cada estrutura e variação criada.
            </CardContent>
          </Card>
        </div>

        {/* Passo 6 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center">6</div>
          <Card className="border-violet-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-violet-600" />
                Itens obrigatórios em TODAS as peças e vídeos
              </CardTitle>
              <CardDescription className="text-xs">Salvo exceções</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {obrigatorios.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Passo 7 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">7</div>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                Avalie, ajuste e suba o briefing final
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 leading-relaxed">
              Depois de avaliar todo o briefing e fazer os ajustes necessários, suba o docx no{" "}
              <a
                href="https://site-seven-indol-47.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-semibold underline underline-offset-2"
              >
                artefato de briefings
              </a>
              .
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
