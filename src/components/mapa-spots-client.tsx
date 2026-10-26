"use client";

import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { Map as MapIcon, Maximize2, Megaphone } from "lucide-react";

// A tela do mapa é a mesma do mapa offline do estande (public/mapas-spots/*.html, gerada por
// projects/mapas-spots/motor/publicar-hub.py). Aqui ela só ganha a moldura do hub.
const MAPAS = [
  { chave: "brasil", titulo: "Brasil", detalhe: "todos os SPOTs, por região e estado", src: "/mapas-spots/brasil.html" },
  { chave: "floripa", titulo: "Florianópolis", detalhe: "os SPOTs da Ilha, por Norte, Centro-Leste e Sul", src: "/mapas-spots/floripa.html" },
] as const;

export function MapaSpotsClient() {
  const [chave, setChave] = useState<(typeof MAPAS)[number]["chave"]>("brasil");
  const mapa = MAPAS.find((m) => m.chave === chave)!;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600">
            <Megaphone className="w-3 h-3" />
            Time comercial
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-orange-500" />
            Mapa interativo dos SPOTs
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl">
            Para mostrar ao cliente, na call, onde fica cada SPOT. Toque no ponto: o mapa voa até o
            prédio e abre a ficha com fotos, &quot;a partir de&quot;, metragem, entrega e fase da obra.
            Os números são buscados no spotômetro e no SZI toda vez que o mapa abre (não é atualização
            semanal); o rodapé do mapa mostra a hora da última atualização. O botão acima do + troca
            entre satélite e terreno.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {MAPAS.map((m) => (
              <button
                key={m.chave}
                onClick={() => setChave(m.chave)}
                title={m.detalhe}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  chave === m.chave ? "bg-orange-500 text-white font-semibold" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {m.titulo}
              </button>
            ))}
          </div>
          <a
            href={mapa.src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:shadow-sm"
          >
            <Maximize2 className="w-4 h-4" />
            Tela cheia
          </a>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-[#0b2235]">
        <iframe
          key={mapa.chave}
          src={mapa.src}
          title={`Mapa dos SPOTs — ${mapa.titulo}`}
          className="block w-full h-[calc(100vh-220px)] min-h-[560px]"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
