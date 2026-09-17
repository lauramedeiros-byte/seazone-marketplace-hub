import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FolderInput, Plug, Terminal, Clapperboard, UploadCloud } from "lucide-react";

const PASSOS = [
  {
    icone: Download,
    titulo: "Peça as duas pastas para a Laura",
    cor: "bg-blue-600",
    corpo: (
      <>
        <p>O motor do briefing não está publicado em lugar nenhum — vem por cópia. São duas pastas:</p>
        <ul className="mt-2 space-y-1">
          <li>
            <code className="px-1 py-0.5 rounded bg-gray-100 font-mono">spot-briefing/</code> — o procedimento, as
            queries e as referências
          </li>
          <li>
            <code className="px-1 py-0.5 rounded bg-gray-100 font-mono">skills/revendas-*-briefing/</code> — as 37
            skills, uma por empreendimento
          </li>
        </ul>
      </>
    ),
  },
  {
    icone: FolderInput,
    titulo: "Coloque em .claude na sua máquina",
    cor: "bg-blue-600",
    corpo: (
      <>
        <p>
          No Windows, <code className="px-1 py-0.5 rounded bg-gray-100 font-mono">~</code> é{" "}
          <code className="px-1 py-0.5 rounded bg-gray-100 font-mono">C:\Users\seu-usuario</code>. Os caminhos de dentro
          são derivados, então o nome de usuário pode ser outro — não precisa reescrever nada.
        </p>
        <pre className="mt-2 p-2.5 rounded-lg bg-gray-900 text-gray-100 text-[11px] overflow-x-auto font-mono">
{`~/.claude/spot-briefing/
~/.claude/skills/revendas-campeche-spot-briefing/
~/.claude/skills/revendas-foz-spot-briefing/
   ... (37 no total)`}
        </pre>
        <p className="mt-2">
          Abra o Claude Code e digite <code className="px-1 py-0.5 rounded bg-gray-100 font-mono">/</code> para conferir
          se as skills aparecem. Se não aparecerem, reinicie a sessão.
        </p>
      </>
    ),
  },
  {
    icone: Plug,
    titulo: "Conecte os dois MCP",
    cor: "bg-blue-600",
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
    cor: "bg-emerald-600",
    corpo: (
      <>
        <p>No Claude Code, digite a barra com o nome do SPOT:</p>
        <pre className="mt-2 p-2.5 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-x-auto font-mono">
          /revendas-campeche-spot-briefing
        </pre>
        <p className="mt-2">
          Troque <code className="px-1 py-0.5 rounded bg-gray-100 font-mono">campeche</code> pelo SPOT que você quer. O
          nome de cada um está na lista de{" "}
          <Link href="/briefings" className="text-blue-600 underline">
            empreendimentos
          </Link>
          .
        </p>
        <p className="mt-2">
          Ele busca tudo na hora: preço, ROI, cotas disponíveis, fase de obra, contexto da região e perfil de hóspede.
          Sai o briefing no terminal e um artefato publicado.
        </p>
      </>
    ),
  },
  {
    icone: Clapperboard,
    titulo: "Peça os roteiros, se quiser",
    cor: "bg-violet-600",
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
      </>
    ),
  },
  {
    icone: UploadCloud,
    titulo: "Suba aqui no hub",
    cor: "bg-emerald-600",
    corpo: (
      <>
        <p>
          O artefato que o Claude publica fica <strong>na sua conta</strong> — ninguém mais abre. Por isso o que vale é
          subir o conteúdo aqui.
        </p>
        <p className="mt-2">
          Abra o empreendimento na{" "}
          <Link href="/briefings" className="text-blue-600 underline">
            lista
          </Link>
          , clique em <strong>Subir briefing</strong> e cole o texto que saiu no terminal. Depois, dentro da pasta que
          foi criada, use <strong>Subir conteúdo</strong> para cada roteiro.
        </p>
      </>
    ),
  },
];

export default function ComoGerarPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Como gerar um briefing</h1>
        <p className="text-gray-500">
          Do zero: instalar a skill na sua máquina, rodar e subir o resultado aqui para o time ver.
        </p>
      </div>

      <Card className="mb-5 border-blue-200 bg-blue-50/40">
        <CardContent className="p-4 text-xs text-gray-700 leading-relaxed">
          <strong className="text-gray-900">Por que precisa subir aqui.</strong> O briefing é gerado no Claude da sua
          máquina, com a sua conta. O artefato que sai é privado e o arquivo fica só aí. Subindo neste hub, o conteúdo
          vai para o banco e todo mundo passa a ver — inclusive quem nem tem a skill instalada.
        </CardContent>
      </Card>

      <div className="relative pl-8 space-y-5 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {PASSOS.map((passo, i) => {
          const Icone = passo.icone;
          return (
            <div key={passo.titulo} className="relative">
              <div
                className={`absolute -left-8 top-0 w-8 h-8 rounded-full ${passo.cor} text-white text-sm font-bold flex items-center justify-center`}
              >
                {i + 1}
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icone className="w-4 h-4 text-gray-500" />
                    {passo.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-gray-600 leading-relaxed">{passo.corpo}</CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Antes de escrever qualquer peça</CardTitle>
          <CardDescription className="text-xs">
            Leia as{" "}
            <Link href="/briefings/regras" className="text-blue-600 underline">
              regras de escrita
            </Link>{" "}
            — palavras travadas, tom e os disclaimers obrigatórios.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
