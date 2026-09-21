"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Md } from "@/components/md";
import { partirSecoes, type BlocoSpot, type ValorComNota } from "@/lib/spot-bloco";
import {
  Building2, MapPin, Images, Globe2, Users, HardHat, Table2, Sparkles,
  BookMarked, ExternalLink, FileText, TrendingUp, Layers,
} from "lucide-react";

/**
 * O briefing desenhado: capa, números em destaque, navegação por seção e as fontes
 * clicáveis no fim. Mesma ordem de seções do artefato, para quem abre os dois não se perder.
 *
 * Briefing antigo (sem o cabeçalho `---`) cai no caminho simples: só as seções em cartão,
 * sem capa nem números — que é exatamente o que dá para montar com o que foi salvo.
 */

const ICONES: { chave: RegExp; icone: typeof Building2 }[] = [
  { chave: /n[úu]mero/i, icone: TrendingUp },
  { chave: /empreendimento|ficha/i, icone: Building2 },
  { chave: /atrativo|diferencia/i, icone: Sparkles },
  { chave: /localiza|endere/i, icone: MapPin },
  { chave: /foto|material|m[íi]dia/i, icone: Images },
  { chave: /por que|mercado|cidade/i, icone: Globe2 },
  { chave: /h[óo]spede|perfil|p[úu]blico/i, icone: Users },
  { chave: /obra|alvar[áa]|licenc/i, icone: HardHat },
  { chave: /cota|spot[óo]metro|pre[çc]o/i, icone: Table2 },
  { chave: /fonte|refer[êe]ncia/i, icone: BookMarked },
  { chave: /ranking|posi[çc]/i, icone: Layers },
];

function iconeDaSecao(titulo: string) {
  return ICONES.find((i) => i.chave.test(titulo))?.icone ?? FileText;
}

/** Um número em destaque. Sem gráfico: é um valor só, o cartão já é a leitura. */
function Tile({
  rotulo, dado, destaque = false,
}: {
  rotulo: string;
  dado: ValorComNota;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        destaque ? "border-sz-azul/25 bg-sz-azul-palido" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{rotulo}</p>
      <p
        className={`mt-1 font-semibold text-sz-navy leading-tight ${
          destaque ? "text-[28px]" : "text-[19px]"
        }`}
      >
        {dado.valor}
      </p>
      {dado.nota && <p className="mt-1 text-[11.5px] leading-snug text-gray-500">{dado.nota}</p>}
    </div>
  );
}

const ORDEM_TILES: [string, string][] = [
  ["faturamento", "Faturamento líquido por cota/ano"],
  ["valorizacao", "Valorização projetada"],
  ["aPartirDe", "A partir de"],
  ["ticketMedio", "Ticket médio"],
  ["cotas", "Cotas disponíveis"],
  ["posicaoCidade", "Posição na cidade"],
  ["posicaoPortfolio", "Posição no portfólio"],
];

const ORDEM_CAPA: [string, string][] = [
  ["fase", "Fase"],
  ["entrega", "Entrega prevista"],
  ["alvara", "Alvará"],
  ["cronograma", "Cronograma"],
];

export function BriefingDoc({
  bloco,
  empreendimento,
  dataGeracao,
}: {
  bloco: BlocoSpot;
  empreendimento: { nome: string; cidade: string; estado: string };
  dataGeracao: string;
}) {
  const secoes = useMemo(() => partirSecoes(bloco.corpo), [bloco.corpo]);
  const [ativa, setAtiva] = useState<string>("");
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const alvos = Object.values(refs.current).filter(Boolean) as HTMLElement[];
    if (alvos.length === 0) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtiva(visivel.target.id);
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 }
    );
    alvos.forEach((a) => observador.observe(a));
    return () => observador.disconnect();
  }, [secoes]);

  const capa = ORDEM_CAPA.filter(([chave]) => bloco.campos[chave]?.valor);
  const roi = bloco.campos.roi;
  const tiles = ORDEM_TILES.filter(([chave]) => bloco.campos[chave]?.valor);
  const temNumeros = Boolean(roi) || tiles.length > 0;

  return (
    <div className="space-y-4">
      {/* Capa */}
      {(capa.length > 0 || bloco.temCabecalho) && (
        <div className="rounded-xl bg-sz-navy px-5 py-4 text-white">
          <p className="text-[11px] uppercase tracking-wide text-sz-azul-claro">
            {empreendimento.cidade} · {empreendimento.estado} · briefing de {dataGeracao}
          </p>
          <h2 className="mt-0.5 text-xl font-bold">{empreendimento.nome}</h2>
          {capa.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {capa.map(([chave, rotulo]) => (
                <div key={chave}>
                  <p className="text-[10.5px] uppercase tracking-wide text-white/50">{rotulo}</p>
                  <p className="text-[13px] font-medium text-white">
                    {bloco.campos[chave].valor}
                    {bloco.campos[chave].nota && (
                      <span className="font-light text-white/70"> · {bloco.campos[chave].nota}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Números */}
      {temNumeros && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {roi && (
            <div className="col-span-2">
              <Tile rotulo="ROI anual líquido" dado={roi} destaque />
            </div>
          )}
          {tiles.map(([chave, rotulo]) => (
            <Tile key={chave} rotulo={rotulo} dado={bloco.campos[chave]} />
          ))}
        </div>
      )}

      {/* Material */}
      {bloco.links.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <Images className="h-3.5 w-3.5" /> Fotos e material
          </p>
          <div className="flex flex-wrap gap-2">
            {bloco.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] text-sz-navy hover:border-sz-azul hover:bg-sz-azul-palido"
              >
                {l.titulo}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navegação */}
      {secoes.length > 2 && (
        <nav className="sticky top-0 z-10 -mx-1 flex gap-1.5 overflow-x-auto bg-white/95 px-1 py-2 backdrop-blur">
          {secoes.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                ativa === s.id
                  ? "border-sz-azul bg-sz-azul text-white"
                  : "border-gray-200 text-gray-600 hover:border-sz-azul hover:text-sz-azul"
              }`}
            >
              {s.titulo}
            </a>
          ))}
        </nav>
      )}

      {/* Seções */}
      {secoes.map((s) => {
        const Icone = iconeDaSecao(s.titulo);
        return (
          <section
            key={s.id}
            id={s.id}
            ref={(el) => {
              refs.current[s.id] = el;
            }}
            className="scroll-mt-20 rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sz-azul-palido">
                <Icone className="h-4 w-4 text-sz-azul" />
              </span>
              <h3 className="text-[15px] font-bold text-sz-navy">{s.titulo}</h3>
            </div>
            <Md>{s.corpo}</Md>
          </section>
        );
      })}

      {/* Fontes */}
      {bloco.fontes.length > 0 && (
        <section id="s-fontes" className="scroll-mt-20 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sz-azul-palido">
              <BookMarked className="h-4 w-4 text-sz-azul" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-sz-navy">Fontes</h3>
              <p className="text-[11.5px] text-gray-500">
                Todo número de mercado citado acima sai de um destes links.
              </p>
            </div>
          </div>
          <ol className="space-y-1.5">
            {bloco.fontes.map((f, i) => (
              <li key={f.url + i} className="flex gap-2 text-[12.5px] leading-relaxed">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-semibold text-gray-500">
                  {i + 1}
                </span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sz-azul underline decoration-sz-azul/30 underline-offset-2 hover:decoration-sz-azul"
                >
                  {f.titulo}
                  <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
