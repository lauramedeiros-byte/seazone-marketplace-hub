"use client";

import { useState, useMemo } from "react";
import type { ComponentType } from "react";
import { type LucideIcon } from "lucide-react";

interface CardDef {
  href: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  cor: string;
}

interface SubCardSearchProps {
  cards: CardDef[];
}

export function SubCardSearch({ cards }: SubCardSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return cards;
    const q = query.toLowerCase();
    return cards.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.descricao.toLowerCase().includes(q)
    );
  }, [query, cards]);

  const showResults = query.trim().length > 0;

  return (
    <div className="space-y-1">
      <input
        type="text"
        placeholder="Buscar sub-card..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full sm:w-80 h-10 rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />
      {showResults && filtered.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum card encontrado.</p>
      )}
    </div>
  );
}
