import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download, FolderInput, Plug, Terminal, Clapperboard, UploadCloud, ClipboardCheck, Link2,
} from "lucide-react";

const BLOCO_BRIEFING = `---
tipo: briefing
spot: campeche-spot
geradoEm: 2026-09-21
geradoPor: Laura
origem: skill
artefato: https://claude.ai/artifact/...
fase: Obra em Andamento
entrega: 31/05/2027
alvara: 100% concluído
cronograma: em linha | 40 dias adiantado
roi: 22,12% | média do empreendimento, revisada em 24/08/2026
faturamento: R$ 67.817,63 | por cota/ano
valorizacao: 86,9% | após a entrega
aPartirDe: R$ 348.000,00 | cota 503, 5º pavimento, 18,86 m²
ticketMedio: R$ 454.572,82 | só apartamentos
cotas: 10 | 9 com preço publicado, 1 sem
posicaoCidade: 5º de 20 | maior faturamento projetado entre as revendas de Florianópolis
posicaoPortfolio: 6º de 37 | entre todas as revendas
link: Pasta do empreendimento (renders e fotos) | https://drive.google.com/...
fonte: FGV — R$ 4,7 bi movimentados em 2024 | https://...
---

## O empreendimento

| | |
|---|---|
| Pavimentos | 6, sendo o 6º o rooftop |

## Por que Florianópolis

O mercado de curta temporada registrou [R$ 1,08 bilhão em receita](https://...) entre
janeiro de 2024 e janeiro de 2025.`;

const BLOCO_ROTEIRO = `---
tipo: roteiro
formato: vídeo narrado
status: teste
duracao: 28 a 30s
monica: não
tese: a cota mais barata do Campeche com praia a 220 m
oQueMuda: abre pelo preço, não pelo ROI
link: Arte de referência | https://drive.google.com/...
---

| Cena | Lettering | Narração |
|---|---|---|
| 1 | a 220 m da praia do Campeche | Existe um jeito de... |`;

const CAMPOS_BRIEFING: [string, string][] = [
  ["spot", "o slug do empreendimento — o hub avisa se não bater com a pasta aberta"],
  ["geradoEm · geradoPor", "data da geração e quem rodou; vira a data da pasta"],
  ["origem", "skill ou manual"],
  ["artefato · docs · observacao", "os links soltos e o recado de quem subiu"],
  ["fase · entrega · alvara · cronograma", "a faixa azul-marinho no topo da página"],
  ["roi", "o número grande, em destaque sozinho"],
  ["faturamento · valorizacao · aPartirDe · ticketMedio · cotas", "os quadradinhos de número"],
  ["posicaoCidade · posicaoPortfolio", "as duas posições, sempre as duas"],
  ["link:", "material — pasta de fotos, informativos, 3D. Repita a linha para cada um"],
  ["fonte:", "de onde saiu cada número de mercado. Repita a linha para cada fonte"],
];

const CAMPOS_ROTEIRO: [string, string][] = [
  ["formato", "vídeo narrado · vídeo apresentadora · estático"],
  ["status", "teste · aprovado · produzido"],
  ["codigo", "R001, R002... em branco, o hub numera sozinho"],
  ["duracao · monica", "duração da peça e se a Mônica entra"],
  ["tese · oQueMuda · derivadoDe", "o que a peça defende, o que muda para as outras, de qual saiu"],
  ["link:", "arte, vídeo ou referência no Drive"],
];

const PASSOS = [
  {
    icone: Download,
    titulo: "Peça as duas pastas para a Laura",
    corpo: (
      <>
        <p>O motor do briefing não está publicado em lugar nenhum — vem por cópia. São duas pastas:</p>
        <ul className="mt-2 space-y-1">
          <li>
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">spot-briefing/</code> — o procedimento, as
            queries e as referências
          </li>
          <li>
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">skills/revendas-*-briefing/</code> — as 37
            skills, uma por empreendimento
          </li>
        </ul>
      </>
    ),
  },
  {
    icone: FolderInput,
    titulo: "Coloque em .claude na sua máquina",
    corpo: (
      <>
        <p>
          No Windows, <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">~</code> é{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">C:\Users\seu-usuario</code>. Os caminhos de dentro
          são derivados, então o nome de usuário pode ser outro — não precisa reescrever nada.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-sz-navy p-2.5 font-mono text-[11px] text-gray-100">
{`~/.claude/spot-briefing/
~/.claude/skills/revendas-campeche-spot-briefing/
~/.claude/skills/revendas-foz-spot-briefing/
   ... (37 no total)`}
        </pre>
        <p className="mt-2">
          Abra o Claude Code e digite <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">/</code> para conferir
          se as skills aparecem. Se não aparecerem, reinicie a sessão.
        </p>
      </>
    ),
  },
  {
    icone: Plug,
    titulo: "Conecte os dois MCP",
    corpo: (
      <>
        <p>Sem eles o briefing não roda, porque é de lá que vêm os números:</p>
        <ul className="mt-2 space-y-1">
          <li>
            <strong>Nekt</strong> — data lake, de onde saem cotas, preços e ranking
          </li>
          <li>
            <strong>spots-prod</strong> — SZI/Spotsys, de onde saem ficha, obra e copy aprovada do site
          </li>
        </ul>
      </>
    ),
  },
  {
    icone: Terminal,
    titulo: "Rode a skill do empreendimento",
    corpo: (
      <>
        <p>No Claude Code, digite a barra com o nome do SPOT:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-sz-navy p-2.5 font-mono text-xs text-gray-100">
          /revendas-campeche-spot-briefing
        </pre>
        <p className="mt-2">
          Troque <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">campeche</code> pelo SPOT que você quer. O
          nome de cada um está na lista de{" "}
          <Link href="/briefings" className="text-sz-azul underline">
            empreendimentos
          </Link>
          .
        </p>
        <p className="mt-2">
          Ele busca tudo na hora: preço, ROI, cotas disponíveis, fase de obra, contexto da região e perfil de hóspede.
          Sai o briefing no terminal, um artefato publicado e — no fim — o <strong>bloco do hub</strong>.
        </p>
      </>
    ),
  },
  {
    icone: Clapperboard,
    titulo: "Peça os roteiros, se quiser",
    corpo: (
      <>
        <p>
          Depois que o briefing sair, peça as peças de mídia paga <strong>na mesma conversa</strong> — os números
          precisam estar frescos ali.
        </p>
        <p className="mt-2">Diga quatro coisas:</p>
        <ul className="mt-1 space-y-1">
          <li>o formato — vídeo narrado, vídeo com apresentadora ou criativo estático</li>
          <li>quantos de cada</li>
          <li>a duração máxima do vídeo</li>
          <li>se a Mônica entra ou não</li>
        </ul>
        <p className="mt-2 text-gray-500">
          Exemplo: <em>&quot;quero 1 vídeo narrado, 1 estático e 1 com a Mônica, vídeos de no máximo 30s&quot;</em>.
        </p>
        <p className="mt-2">Cada roteiro aprovado também sai com o bloco pronto para colar.</p>
      </>
    ),
  },
  {
    icone: UploadCloud,
    titulo: "Cole o bloco aqui no hub",
    corpo: (
      <>
        <p>
          O artefato que o Claude publica fica <strong>na sua conta</strong> — ninguém mais abre. Por isso o que vale é
          colar o conteúdo aqui.
        </p>
        <p className="mt-2">
          Abra o empreendimento na{" "}
          <Link href="/briefings" className="text-sz-azul underline">
            lista
          </Link>
          , clique em <strong>Subir briefing</strong> e cole o bloco inteiro — <strong>uma colagem só</strong>. Data,
          autor, artefato, números, material e fontes saem do cabeçalho sozinhos; o hub mostra o que leu antes de você
          confirmar. Depois, dentro da pasta criada, use <strong>Subir conteúdo</strong> e cole o bloco de cada roteiro.
        </p>
      </>
    ),
  },
];

function TabelaCampos({ linhas }: { linhas: [string, string][] }) {
  return (
    <dl className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
      {linhas.map(([campo, papel]) => (
        <div key={campo} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-3">
          <dt className="font-mono text-[11.5px] text-sz-navy">{campo}</dt>
          <dd className="text-[12px] text-gray-600">{papel}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ComoGerarPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <BackButton />

      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-sz-navy">Como gerar um briefing</h1>
        <p className="text-gray-500">
          Do zero: instalar a skill na sua máquina, rodar e colar o resultado aqui para o time ver.
        </p>
      </div>

      <Card className="mb-5 border-sz-azul/20 bg-sz-azul-palido/50">
        <CardContent className="p-4 text-xs leading-relaxed text-gray-700">
          <strong className="text-sz-navy">Por que precisa subir aqui.</strong> O briefing é gerado no Claude da sua
          máquina, com a sua conta. O artefato que sai é privado e o arquivo fica só aí. Colando neste hub, o conteúdo
          vai para o banco e todo mundo passa a ver — inclusive quem nem tem a skill instalada.
        </CardContent>
      </Card>

      <div className="relative space-y-5 pl-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 before:content-['']">
        {PASSOS.map((passo, i) => {
          const Icone = passo.icone;
          return (
            <div key={passo.titulo} className="relative">
              <div className="absolute -left-8 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-sz-azul text-sm font-bold text-white">
                {i + 1}
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icone className="h-4 w-4 text-gray-500" />
                    {passo.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs leading-relaxed text-gray-600">{passo.corpo}</CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="mt-6" id="formato">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4 text-sz-azul" /> O formato do bloco
          </CardTitle>
          <CardDescription className="text-xs">
            O cabeçalho vai entre duas linhas de <code>---</code>, no formato{" "}
            <code>chave: valor | observação</code>. É o que vira a capa, os números em destaque e a lista de fontes.
            Campo que você não tiver, é só não escrever a linha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-gray-600">
          <div>
            <p className="mb-1.5 font-semibold text-sz-navy">Briefing</p>
            <pre className="overflow-x-auto rounded-lg bg-sz-navy p-3 font-mono text-[11px] leading-relaxed text-gray-100">
              {BLOCO_BRIEFING}
            </pre>
            <div className="mt-2">
              <TabelaCampos linhas={CAMPOS_BRIEFING} />
            </div>
          </div>

          <div>
            <p className="mb-1.5 font-semibold text-sz-navy">Roteiro de vídeo ou criativo estático</p>
            <pre className="overflow-x-auto rounded-lg bg-sz-navy p-3 font-mono text-[11px] leading-relaxed text-gray-100">
              {BLOCO_ROTEIRO}
            </pre>
            <div className="mt-2">
              <TabelaCampos linhas={CAMPOS_ROTEIRO} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="font-semibold text-sz-navy">Três coisas que mudam a cara da página</p>
            <ul className="mt-1.5 space-y-1">
              <li>
                <strong>Seções são <code>##</code>.</strong> Cada uma vira um cartão com ícone e entra na barra de
                navegação do topo.
              </li>
              <li>
                <strong>Tabela de duas colunas sem cabeçalho</strong> (<code>| | |</code>) vira ficha rótulo/valor —
                é o formato certo para &quot;O empreendimento&quot;.
              </li>
              <li>
                <strong>Citação com <code>&gt;</code></strong> vira cartão de recado. Começando com ⚠️, sai em coral,
                que é o aviso de divergência.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="font-semibold text-sz-navy">Copiou torto? O hub endireita</p>
            <p className="mt-1 leading-relaxed">
              Copiar do terminal costuma estragar o bloco de três jeitos: a primeira linha{" "}
              <code>---</code> fica para trás, as outras linhas ganham um recuo, e as linhas compridas quebram no
              meio — jogando a URL de uma <code>fonte:</code> para a linha de baixo. O hub conserta os três na hora
              de ler, inclusive link de markdown partido pela quebra. Se mesmo assim não aparecer o{" "}
              <strong>&quot;Li do bloco&quot;</strong>, é sinal de que o cabeçalho não veio junto — role a colagem
              até o começo e confira.
            </p>
          </div>

          <div className="rounded-lg border border-sz-coral-palido bg-sz-coral-fundo p-3">
            <p className="flex items-center gap-1.5 font-semibold text-sz-navy">
              <Link2 className="h-3.5 w-3.5 text-sz-coral" /> Fonte é obrigatória, e clicável
            </p>
            <p className="mt-1 leading-relaxed">
              Todo número de mercado — receita da cidade, ranking de buscas, estudo — entra com o link no meio do texto{" "}
              <em>e</em> como linha <code>fonte:</code> no cabeçalho. Sem isso a página não mostra de onde o número
              saiu, e foi exatamente o que aconteceu no primeiro briefing do Campeche. Dado de 2022 para trás não
              entra.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Antes de escrever qualquer peça</CardTitle>
          <CardDescription className="text-xs">
            Leia as{" "}
            <Link href="/briefings/regras" className="text-sz-azul underline">
              regras de escrita
            </Link>{" "}
            — palavras travadas, tom, fontes e os disclaimers obrigatórios.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
