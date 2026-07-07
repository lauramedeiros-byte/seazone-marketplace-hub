"use client";

import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Copy,
  Check,
  MessageSquareText,
  Bell,
  Image as ImageIcon,
  FileCheck2,
  Send,
  ExternalLink,
} from "lucide-react";

const PROMPT = `# MENSAGENS PARA COMUNIDADE DA MÔNICA — SPOTS SEAZONE

Você vai me ajudar a escrever mensagens curtas para divulgar Spots da Seazone na comunidade da Mônica. Vou enviar uma imagem de cada Spot e informar diferenciais adicionais. Para cada Spot, gere 3 versões (V1, V2, V3) seguindo as regras abaixo.

## REGRAS GERAIS
- Limite máximo de 75 palavras por mensagem (não exibir contagem na resposta)
- Texto fluido, sem travessões, sem bullet points
- Não inserir emojis no meio do texto, apenas o 👉 antes do CTA final
- Tom casual e direto, como se estivesse conversando com a comunidade
- Sempre finalizar com: 👉 Fala com o especialista responsável: [link WhatsApp]
- Variar a abertura entre as versões: "Oi gente!", "Oi pessoal!", "Ei,"
- Variar o CTA entre as versões: "Fala com o especialista responsável", "Fala direto com o especialista", "Fala agora com o especialista responsável"

## ESTRUTURA DE CADA VERSÃO
V1 — Versão completa, destacando o diferencial principal informado, com argumentação mais detalhada
V2 — Versão intermediária, abrindo com um argumento de mercado/escassez/oportunidade
V3 — Versão enxuta, direta ao ponto, só com os dados essenciais

## DADOS QUE DEVEM APARECER
Extrair da imagem:
- Nome do Spot e cidade/região
- Valor anunciado
- Percentual abaixo do mercado
- Valor da economia imediata
- Entrega prevista (omitir se eu pedir, em casos de prazo longo desfavorável)
- Outras informações relevantes do card (parcelamento, obras, etc.)

Aplicar conforme eu informar:
- Diferenciais específicos do Spot (vista, planta, localização, etc.)
- Argumentos de mercado e demanda

## REGRAS SOBRE A GESTÃO SEAZONE
A gestão Seazone é um serviço opcional, não inclusa no imóvel. Quando mencionar, usar fraseado como: "Com a gestão Seazone, você investe em Airbnb sem se preocupar com a operação e a estratégia." Mencionar apenas em uma das três versões, não em todas.

## ESTILO DE ESCRITA
- Frases curtas e diretas
- Sem jargão corporativo
- Transmitir confiança sem exagero
- Quando citar eventos/sazonalidade, exemplificar em uma versão e generalizar nas outras (ex: "demanda nas quatro estações")
- Evitar repetir o mesmo argumento entre as três versões: cada uma deve ter um ângulo diferente

## FLUXO DE TRABALHO
1. Eu envio a imagem do Spot e os diferenciais
2. Você gera as 3 versões seguindo as regras acima
3. Eu peço ajustes se necessário
4. Seguimos para o próximo Spot

Pronto para começar. Pode me pedir o primeiro Spot.`;

const MSG_COMUNIDADE = `textos ⛲ e imagens 🖼️ no artefato! @Mônica Medeiros @Giulia Machado`;

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard indisponível */
        }
      }}
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copiado!" : label}
    </Button>
  );
}

export default function OppsTextosMonicaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Textos para as opps escolhidas da Mônica</h1>
        <p className="text-gray-500 text-sm">
          Passo a passo para gerar os textos da comunidade a partir das cotas que a Mônica escolheu.
        </p>
      </div>

      <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {/* Passo 1 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">1</div>
          <Card className="border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-purple-600" />
                Cole este prompt no seu Claude Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-2">
                <CopyButton text={PROMPT} label="Copiar prompt" />
              </div>
              <pre className="text-[11px] leading-relaxed text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-80 overflow-auto whitespace-pre-wrap font-mono">
{PROMPT}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Passo 2 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">2</div>
          <Card className="border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                Aguarde a Mônica escolher as 3 opps
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 leading-relaxed">
              Quando a Mônica escolher as 3 opps, chega um aviso no canal <strong>#comunidade-investidores</strong> (geralmente na <strong>sexta ou segunda-feira</strong>).
            </CardContent>
          </Card>
        </div>

        {/* Passo 3 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">3</div>
          <Card className="border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                Pegue as imagens no artefato da Mônica
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 leading-relaxed space-y-2">
              <p>
                Abra o{" "}
                <a href="https://opps-seazone.vercel.app/#marketplace" target="_blank" rel="noopener noreferrer" className="text-purple-700 font-medium underline underline-offset-2 inline-flex items-center gap-1">
                  artefato da Mônica <ExternalLink className="w-3 h-3" />
                </a>
                , pegue as imagens das cotas que ela escolheu e jogue as <strong>3 imagens de uma vez</strong> no chat do Claude onde você colou o prompt.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Passo 4 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">4</div>
          <Card className="border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                Gere os textos, revise e cole o link no artefato
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 leading-relaxed">
              Pronto! No próprio chat o Claude gera <strong>3 opções de texto para cada cota</strong>. Você só precisa colocar em um <strong>docx</strong> para revisar se não tem nada estranho, deixar o arquivo <strong>aberto para qualquer um editar</strong>, e colar o link do docx no artefato dela, nas cotas que ela escolheu.
            </CardContent>
          </Card>
        </div>

        {/* Passo 5 */}
        <div className="relative">
          <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">5</div>
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Avise a comunidade que os materiais estão prontos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 leading-relaxed">
              <p className="mb-2">Depois de colocar o texto, cole na <strong>#comunidade-investidores</strong> uma mensagem — assim a Mônica e a Giulia já sabem que podem usar os materiais na semana:</p>
              <div className="flex items-start justify-between gap-2 bg-white border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">{MSG_COMUNIDADE}</p>
                <CopyButton text={MSG_COMUNIDADE} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
