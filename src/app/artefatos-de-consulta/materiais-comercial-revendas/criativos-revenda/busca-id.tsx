"use client";

import { useState } from "react";

// IDs dos anúncios que subiram no Meta em 01/09/2026, por grupo de criativo.
// Para incluir um ID novo, basta acrescentar na lista do grupo certo —
// a busca e os chips de cada grupo leem daqui.
export const IDS_POR_GRUPO: Record<string, string[]> = {
  "1": [
    "120249079239900599",
    "120249079232710599",
    "120249079225180599",
    "120249079210280599",
    "120249078693880599",
    "120249078690860599",
    "120249078692800599",
    "120249078695280599",
  ],
  "2": ["120249079229410599", "120249079246740599", "120249079219920599"],
  "3": [],
};

const GRUPOS: Record<string, { nome: string; ancora: string }> = {
  "1": { nome: "Renda no curto prazo", ancora: "#g1" },
  "2": { nome: "Fluxo de pagamento total mais leve", ancora: "#g2" },
  "3": { nome: "Entrada parcelada", ancora: "#g3" },
};

// Só os dígitos: o pré-vendedor costuma colar com espaço ou aspas em volta
function digitos(s: string): string {
  return s.replace(/\D/g, "");
}

// Busca em pouco mais de uma dezena de IDs — não compensa memoizar
function procurar(termo: string): { grupo: string | null; id: string | null } | null {
  const q = digitos(termo);
  if (q.length < 3) return null;
  for (const [grupo, ids] of Object.entries(IDS_POR_GRUPO)) {
    const achou = ids.find((id) => id === q || id.includes(q));
    if (achou) return { grupo, id: achou };
  }
  return { grupo: null, id: null };
}

export function BuscaId() {
  const [termo, setTermo] = useState("");
  const resultado = procurar(termo);

  return (
    <div className="busca">
      <label className="busca-label" htmlFor="busca-id">
        Buscar criativo pelo ID
      </label>
      <input
        id="busca-id"
        type="search"
        inputMode="numeric"
        autoComplete="off"
        className="busca-input"
        placeholder="Cole o ID do anúncio"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
      />

      {resultado && resultado.grupo && (
        <a className="busca-hit" href={GRUPOS[resultado.grupo].ancora}>
          <span className="busca-num">{resultado.grupo}</span>
          <span className="busca-txt">
            <b>{GRUPOS[resultado.grupo].nome}</b>
            <small>{resultado.id}</small>
          </span>
          <span className="busca-seta">Ver o grupo →</span>
        </a>
      )}

      {resultado && !resultado.grupo && (
        <p className="busca-miss">
          Nenhum criativo com esse ID nesta leva. Confira o número no
          Gerenciador de Anúncios — pode ser de uma campanha anterior.
        </p>
      )}
    </div>
  );
}

// Chips com os IDs de um grupo, para conferir a olho
export function IdsDoGrupo({ grupo }: { grupo: string }) {
  const ids = IDS_POR_GRUPO[grupo] ?? [];

  if (ids.length === 0) {
    return (
      <div className="chips">
        <div className="chips-label">IDs dos anúncios</div>
        <p className="busca-miss">
          Os IDs deste grupo ainda não foram enviados pelo marketing.
        </p>
      </div>
    );
  }

  return (
    <div className="chips">
      <div className="chips-label">
        IDs dos anúncios · {ids.length}{" "}
        {ids.length === 1 ? "criativo" : "criativos"}
      </div>
      <div className="chips-row ids">
        {ids.map((id) => (
          <span key={id}>{id}</span>
        ))}
      </div>
    </div>
  );
}
