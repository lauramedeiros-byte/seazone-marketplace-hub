import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, ArrowRightLeft, ShieldCheck, AlertTriangle, MessageSquareText } from "lucide-react";

const palavrasTravadas = ["unidade", "imóvel", "apartamento", "studio", "(e plurais)"];
const substituirPor = ["a cota", "o investimento", "a oportunidade", "o empreendimento", "o SPOT", "o ativo"];
const obrigatorios = [
  "Logo da Seazone e do SPOT desde o início",
  "Localização do SPOT (cidade + sigla do estado — ex: Florianópolis - SC)",
  "Disclaimer de rentabilidade no final de cada criação",
  "CTA",
];

const DISCLAIMER_RENTABILIDADE =
  "Este material tem caráter exclusivamente informativo e não constitui uma promessa de rentabilidade futura ou garantia de retorno financeiro. Os resultados financeiros do investimento dependem da performance do empreendimento após sua conclusão, especialmente da futura valorização patrimonial do imóvel e da renda gerada por sua eventual locação. A Seazone não oferece garantia de rendimento fixo, retorno mínimo ou qualquer tipo de remuneração automática sobre o capital investido.";

export default function RegrasBriefingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Regras de escrita</h1>
        <p className="text-gray-500">
          Valem para todo briefing e roteiro de Marketplace e SZI. Cole na IA antes da revisão.{" "}
          <Link href="/briefings/como-gerar" className="text-blue-600 underline">
            Ver como gerar um briefing
          </Link>
          .
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-600" /> Palavras travadas
              </CardTitle>
              <CardDescription className="text-xs">Nunca usar em lettering, locução ou texto de peça.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {palavrasTravadas.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[11px]">
                  {p}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" /> Substituir por
              </CardTitle>
              <CardDescription className="text-xs">O vocabulário que a casa usa no lugar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {substituirPor.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px]">
                  {p}
                </span>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-blue-600" /> Tom e termos sensíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-2 leading-relaxed">
            <p>
              <strong className="text-gray-800">Tom:</strong> formal mas não engessado, com fluidez e coesão entre as
              frases, sem gírias regionais, palavras simples.
            </p>
            <p>
              <strong className="text-gray-800">Evite &quot;renda passiva&quot;</strong> — troque por renda futura, renda
              com aluguel por temporada, short stay, locação de temporada ou Airbnb.
            </p>
            <p>
              <strong className="text-gray-800">&quot;Valorização&quot; nunca solta</strong> — sempre &quot;valorização
              após a entrega do empreendimento&quot;.
            </p>
            <p>
              <strong className="text-gray-800">Projeção, nunca promessa</strong> — &quot;projeção de&quot;,
              &quot;estimada&quot;, &quot;projetada&quot;. Nunca rentabilidade garantida.
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600" /> Obrigatório em todas as peças
            </CardTitle>
            <CardDescription className="text-xs">Salvo exceções.</CardDescription>
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

        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Disclaimer de rentabilidade — automático</CardTitle>
            <CardDescription className="text-xs">
              Entra sozinho em toda peça que fale de valores, rendimento ou mostre imagem do empreendimento. Vai no
              rodapé, em fonte pequena, <strong>sem nenhum outro texto emendado</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-gray-600 leading-relaxed border border-dashed border-blue-200 rounded-lg p-3 bg-white">
              {DISCLAIMER_RENTABILIDADE}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Disclaimer de pagamento — regra corrigida
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-700 space-y-2 leading-relaxed">
            <p>
              <strong className="text-gray-900">Vale hoje:</strong> o disclaimer{" "}
              <em>&quot;*Não aceitamos FGTS e carta de crédito.&quot;</em> <strong>não é automático</strong>. Só entra
              quando quem pede a arte solicitar explicitamente.
            </p>
            <p className="text-gray-500">
              A versão anterior desta página mandava incluir sempre que a peça ofertasse SPOT ou cota. Isso foi{" "}
              <strong>revertido pelo jurídico</strong> (resposta no #suporte-juridico, fev/2026): inserir por padrão
              expõe condição comercial sem necessidade. Se o disclaimer de pagamento entrar junto com o de
              rentabilidade, ele vai em bloco separado, nunca emendado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
