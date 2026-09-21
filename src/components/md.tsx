"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Info, TriangleAlert } from "lucide-react";
import { partirEmBlocos } from "@/lib/spot-bloco";

/**
 * Renderiza o markdown dos briefings e dos roteiros.
 *
 * Três coisas que o markdown cru não dava e aqui são tratadas:
 * 1. **Ficha** — tabela de duas colunas sem cabeçalho (`| | |`) vira lista rótulo/valor.
 *    É o caso de "Números" e "O empreendimento": como tabela, saía com uma faixa de
 *    cabeçalho vazia e linhas apertadas.
 * 2. **Avisos** — citação (`>`) vira cartão. Começou com ⚠️, sai em coral.
 * 3. **Links** — sempre abrem em aba nova, com o ícone de link externo.
 */

const CLASSES_TEXTO =
  "text-[13.5px] leading-[1.7] text-gray-700 " +
  "[&>p]:my-3 [&>ul]:my-3 [&>ol]:my-3 " +
  "[&_h3]:text-[13px] [&_h3]:font-bold [&_h3]:text-sz-navy [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:mt-5 [&_h3]:mb-2 " +
  "[&_h4]:text-[13px] [&_h4]:font-semibold [&_h4]:text-sz-navy [&_h4]:mt-4 [&_h4]:mb-1 " +
  "[&_strong]:font-semibold [&_strong]:text-sz-navy " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 " +
  "[&_li]:marker:text-sz-azul " +
  "[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] " +
  "[&_hr]:my-5 [&_hr]:border-gray-200 " +
  "[&_em]:text-gray-500";

const CLASSES_TABELA =
  "[&_table]:w-full [&_table]:text-[12.5px] [&_table]:border-collapse [&_table]:my-3 " +
  "[&_thead_th]:bg-sz-azul-palido [&_thead_th]:text-left [&_thead_th]:font-semibold [&_thead_th]:text-sz-navy " +
  "[&_thead_th]:px-2.5 [&_thead_th]:py-2 [&_thead_th]:border-b [&_thead_th]:border-sz-azul/20 " +
  "[&_tbody_td]:px-2.5 [&_tbody_td]:py-2 [&_tbody_td]:border-b [&_tbody_td]:border-gray-100 [&_tbody_td]:align-top " +
  "[&_tbody_td]:tabular-nums [&_tbody_tr:hover]:bg-gray-50/70";

function textoDe(no: ReactNode): string {
  if (no === null || no === undefined || typeof no === "boolean") return "";
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textoDe).join("");
  if (typeof no === "object" && no !== null && "props" in no) {
    const props = (no as { props?: { children?: ReactNode } }).props;
    return textoDe(props?.children);
  }
  return "";
}

const COMPONENTES = {
  a({ href, children }: { href?: string; children?: ReactNode }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        /* `inline`, não `inline-flex`: link longo no meio do parágrafo precisa quebrar
           linha junto com o texto. O `[&_strong]` é porque o negrito dentro do link
           herdava a cor do texto e o link saía metade azul, metade preto. */
        className="text-sz-azul underline decoration-sz-azul/30 underline-offset-2 hover:decoration-sz-azul [&_strong]:text-sz-azul"
      >
        {children}
        <ExternalLink className="ml-0.5 inline h-3 w-3 align-baseline opacity-60" />
      </a>
    );
  },
  blockquote({ children }: { children?: ReactNode }) {
    const alerta = /^\s*(⚠️|❗|atenção|divergência)/i.test(textoDe(children).trim());
    const Icone = alerta ? TriangleAlert : Info;
    return (
      <div
        className={`my-3 flex gap-2.5 rounded-lg border p-3 ${
          alerta ? "border-sz-coral-palido bg-sz-coral-fundo" : "border-sz-azul/15 bg-sz-azul-palido/60"
        }`}
      >
        <Icone className={`w-4 h-4 shrink-0 mt-0.5 ${alerta ? "text-sz-coral" : "text-sz-azul"}`} />
        <div className="[&>p]:my-0 [&>p+p]:mt-1.5 text-[12.5px] leading-relaxed text-gray-700 [&_strong]:text-sz-navy">
          {children}
        </div>
      </div>
    );
  },
  table({ children }: { children?: ReactNode }) {
    return (
      <div className="my-3 overflow-x-auto rounded-lg border border-gray-200">
        <table>{children}</table>
      </div>
    );
  },
};

/** Markdown inline (sem o `<p>` em volta) — usado nas células da ficha. */
export function MdInline({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...COMPONENTES, p: ({ children }: { children?: ReactNode }) => <>{children}</> }}>
      {children}
    </ReactMarkdown>
  );
}

function Ficha({ linhas }: { linhas: [string, string][] }) {
  return (
    <dl className="my-3 divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
      {/* No celular o rótulo vai em cima do valor: lado a lado sobra pouca largura para o
          valor, e tudo quebra em duas ou três linhas. */}
      {linhas.map(([rotulo, valor], i) => (
        <div
          key={`${rotulo}-${i}`}
          className="grid grid-cols-1 gap-0.5 px-3 py-2 odd:bg-gray-50/50 sm:grid-cols-[minmax(7rem,11rem)_1fr] sm:gap-3"
        >
          <dt className="text-[12.5px] font-medium text-gray-500 leading-relaxed">
            <MdInline>{rotulo}</MdInline>
          </dt>
          <dd className="text-[12.5px] text-gray-800 leading-relaxed [&_strong]:text-sz-navy [&_strong]:font-semibold">
            <MdInline>{valor}</MdInline>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Md({ children }: { children: string }) {
  const blocos = partirEmBlocos(children ?? "");
  return (
    <div className={`${CLASSES_TEXTO} ${CLASSES_TABELA}`}>
      {blocos.map((bloco, i) =>
        bloco.tipo === "ficha" ? (
          <Ficha key={i} linhas={bloco.linhas} />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={COMPONENTES}>
            {bloco.texto}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
