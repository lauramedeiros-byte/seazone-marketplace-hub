"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BackButton } from "@/components/back-button";

// ─── Card definitions ──────────────────────────────────────────────────────────
const CARDS: Record<string, { l: string; s: "sz" | "mk" }> = {
  sz_timing: { l: "Timing", s: "sz" },
  sz_conc: { l: "Concorrência", s: "sz" },
  sz_corretor: { l: "Corretor/Imobiliária", s: "sz" },
  sz_juridico: { l: "Perfil — Jurídico", s: "sz" },
  sz_dup: { l: "Duplicado/Erro", s: "sz" },
  sz_contato: { l: "Contato Inválido", s: "sz" },
  sz_lgpd: { l: "LGPD", s: "sz" },
  sz_hospede: { l: "Hóspede", s: "sz" },
  sz_moradia: { l: "Perfil — Interesse em Moradia", s: "sz" },
  sz_fgts: { l: "Perfil — FGTS/Financiamento", s: "sz" },
  sz_pgto: { l: "Perfil — Forma de Pagamento", s: "sz" },
  sz_entrada: { l: "Perfil — Valor de Entrada", s: "sz" },
  sz_total: { l: "Perfil — Valor Total", s: "sz" },
  sz_tam: { l: "Perfil — Tamanho", s: "sz" },
  sz_garagem: { l: "Perfil — Garagem", s: "sz" },
  sz_prazo: { l: "Perfil — Prazo de Entrega", s: "sz" },
  sz_spe: { l: "Perfil — SPE", s: "sz" },
  sz_cota: { l: "Cota Indisponível", s: "sz" },
  sz_outra_cota: { l: "Seguiu com Outra Cota", s: "sz" },
  sz_catch: { l: "Perfil — (descrição obrigatória)", s: "sz" },
  sz_mkt: { l: "Encaminhado p/ Marketplace", s: "sz" },
  sz_szs: { l: "Encaminhado p/ SZS", s: "sz" },
  sz_decor_enc: { l: "Encaminhado p/ Decor", s: "sz" },
  sz_lanc_enc: { l: "Encaminhado p/ Lançamento", s: "sz" },
  sz_cly: { l: "Encaminhado p/ Customer Loyalty", s: "sz" },
  sz_enxoval: { l: "Enxoval", s: "sz" },
  sz_taxa_adm: { l: "Taxa de Administração", s: "sz" },
  sz_taxa_imp: { l: "Taxa de Implantação", s: "sz" },
  sz_vendeu: { l: "Vendeu Imóvel", s: "sz" },
  sz_regiao: { l: "Região Não Atendida", s: "sz" },
  sz_anfitriao: { l: "Quer ser Anfitrião → Franquias", s: "sz" },
  sz_dcap: { l: "[Decor] Chamada de Capital", s: "sz" },
  sz_dproj: { l: "[Decor] Projeto", s: "sz" },
  sz_dobras: { l: "[Decor] Spot/B2B Obras", s: "sz" },
  sz_efut: { l: "[Expansão] Lançamento Futuro", s: "sz" },
  sz_esem: { l: "[Expansão] Sem Lançamento Previsto", s: "sz" },
  sz_icond: { l: "Imóvel fora Perfil — Condomínio", s: "sz" },
  sz_idesc: { l: "Imóvel fora Perfil — Descrição", s: "sz" },
  sz_iitens: { l: "Imóvel fora Perfil — Itens Obrigatórios", s: "sz" },
  sz_mora: { l: "Perfil — Mora no Imóvel/Alugado", s: "sz" },
  sz_b2b: { l: "Lead B2B sem Perfil", s: "sz" },
  sz_parceiro: { l: "Parceiro fora do Perfil", s: "sz" },
  sz_cliente: { l: "Já é Cliente", s: "sz" },
  sz_resgate: { l: "Perdido em Resgate Parceiros", s: "sz" },
  mk_naoresp: { l: "Não atende / Não responde", s: "mk" },
  mk_origem: { l: "Não reconhece a Origem", s: "mk" },
  mk_parou: { l: "Parou de Responder", s: "mk" },
  mk_timing: { l: "Timing", s: "mk" },
  mk_conc: { l: "Concorrência", s: "mk" },
  mk_corretor: { l: "Corretor/Imobiliária", s: "mk" },
  mk_loc: { l: "Localização do Spot", s: "mk" },
  mk_moradia: { l: "Perfil — Interesse em Moradia", s: "mk" },
  mk_prazo: { l: "Perfil — Prazo de Entrega", s: "mk" },
  mk_cond: { l: "Perfil — Condições de Pagamento", s: "mk" },
  mk_entrada: { l: "Perfil — Valor Mínimo Entrada", s: "mk" },
  mk_total: { l: "Perfil — Valor Total", s: "mk" },
  mk_juridico: { l: "Perfil — Jurídico", s: "mk" },
  mk_tam: { l: "Perfil — Tamanho", s: "mk" },
  mk_spe: { l: "Perfil — SPE", s: "mk" },
  mk_catch: { l: "Perfil — (descrição obrigatória)", s: "mk" },
  mk_dup: { l: "Duplicado/Erro", s: "mk" },
  mk_lanc: { l: "Encaminhado p/ Lançamentos", s: "mk" },
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  blue: "#1d4ed8",
  blueSoft: "#eff6ff",
  blueBorder: "#bfdbfe",
  border: "#e2e8f0",
  borderHover: "#94a3b8",
  szBg: "#FAECE7",
  szBorder: "#F5C4B3",
  szText: "#993C1D",
  szBadge: "#F0997B",
  szBadgeText: "#4A1B0C",
  mkBg: "#E6F1FB",
  mkBorder: "#B5D4F4",
  mkText: "#185FA5",
  mkBadge: "#85B7EB",
  mkBadgeText: "#042C53",
  surface: "#fff",
  surfaceAlt: "#f8fafc",
  sectionFazer: "#059669",
  sectionFazerBg: "#ecfdf5",
  sectionFazerBorder: "#6ee7b7",
  sectionNaoFazer: "#64748b",
  sectionNaoFazerBg: "#f1f5f9",
  sectionNaoFazerBorder: "#cbd5e1",
  curtoBg: "#fffbeb",
  curtoBorder: "#fcd34d",
  curtoColor: "#b45309",
  longoBg: "#eff6ff",
  longoBorder: "#93c5fd",
  longoColor: "#1e40af",
};

// ─── Types ───────────────────────────────────────────────────────────────────────
interface Group {
  id: string;
  section: "curtoPrazo" | "longoPrazo" | "fazer" | "naoFazer";
  label: string;
  cards: string[];
}

interface Message {
  id: string;
  type: "email" | "whatsapp";
  content: string;
  subject: string;
  tags: string[];
  comment: string;
  image: string | null;
}

interface BoardState {
  groups: Group[];
  messages: Record<string, Message[]>;
  tags: string[];
}

// ─── Default groups ────────────────────────────────────────────────────────────
const DEFAULT_GROUPS: Group[] = [
  { id: "g1", section: "curtoPrazo", label: "Timing / Momento", cards: ["sz_timing", "mk_timing"] },
  { id: "g2", section: "curtoPrazo", label: "Concorrência", cards: ["sz_conc", "mk_conc"] },
  { id: "g3", section: "curtoPrazo", label: "Corretor / Imobiliária", cards: ["sz_corretor", "mk_corretor"] },
  { id: "g4", section: "curtoPrazo", label: "Jurídico / Contratual", cards: ["sz_juridico", "mk_juridico"] },
  { id: "g5", section: "naoFazer", label: "Duplicado / Erro Admin", cards: ["sz_dup", "mk_dup"] },
  { id: "g6", section: "curtoPrazo", label: "Sem Contato / Inatingível", cards: ["sz_contato", "mk_naoresp", "mk_parou", "mk_origem"] },
  { id: "g7", section: "curtoPrazo", label: "Perfil — Financeiro", cards: ["sz_fgts", "sz_pgto", "sz_entrada", "sz_total", "mk_cond", "mk_entrada", "mk_total"] },
  { id: "g8", section: "curtoPrazo", label: "Perfil — Produto / Características", cards: ["sz_tam", "sz_garagem", "sz_prazo", "sz_spe", "sz_cota", "sz_outra_cota", "mk_tam", "mk_prazo", "mk_spe", "mk_loc"] },
  { id: "g9", section: "naoFazer", label: "Perfil — Intenção Incompatível", cards: ["sz_moradia", "sz_hospede", "sz_lgpd", "sz_mora", "mk_moradia"] },
  { id: "g10", section: "naoFazer", label: "Redirecionamento Interno", cards: ["sz_mkt", "sz_szs", "sz_decor_enc", "sz_lanc_enc", "sz_cly", "sz_anfitriao", "mk_lanc"] },
  { id: "g11", section: "curtoPrazo", label: "Catch-all / Descrição Obrigatória", cards: ["sz_catch", "mk_catch"] },
  { id: "g12", section: "naoFazer", label: "Imóvel fora do Perfil SZS", cards: ["sz_icond", "sz_idesc", "sz_iitens"] },
  { id: "g13", section: "curtoPrazo", label: "Taxas / Custos Operacionais", cards: ["sz_enxoval", "sz_taxa_adm", "sz_taxa_imp"] },
  { id: "g14", section: "curtoPrazo", label: "Exclusivo — Decor", cards: ["sz_dcap", "sz_dproj", "sz_dobras"] },
  { id: "g15", section: "naoFazer", label: "Exclusivo — Expansão / B2B", cards: ["sz_efut", "sz_esem", "sz_b2b", "sz_parceiro", "sz_cliente", "sz_resgate"] },
  { id: "g16", section: "naoFazer", label: "Sem Grupo", cards: ["sz_vendeu", "sz_regiao"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────────
function getSectionColor(section: string) {
  if (section === "curtoPrazo" || section === "fazer") return C.curtoColor;
  if (section === "longoPrazo") return C.longoColor;
  if (section === "fazer") return C.sectionFazer;
  return C.sectionNaoFazer;
}

function getSectionBg(section: string) {
  if (section === "curtoPrazo" || section === "fazer") return C.curtoBg;
  if (section === "longoPrazo") return C.longoBg;
  if (section === "fazer") return "#f0fdf4";
  return "#f8fafc";
}

function getSectionBorderColor(section: string) {
  if (section === "curtoPrazo" || section === "fazer") return C.curtoBorder;
  if (section === "longoPrazo") return C.longoBorder;
  if (section === "fazer") return C.sectionFazerBorder;
  return C.sectionNaoFazerBorder;
}

function getSectionLabel(section: string) {
  if (section === "curtoPrazo" || section === "fazer") return "⚡ CURTO PRAZO";
  if (section === "longoPrazo") return "📆 LONGO PRAZO";
  if (section === "fazer") return "✓ FAZER";
  return "✗ NÃO FAZER";
}

function getNextSection(current: string) {
  const order = ["curtoPrazo", "longoPrazo", "fazer", "naoFazer"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

// ─── Drag handle ───────────────────────────────────────────────────────────────
function DragHandle({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        cursor: "grab",
        color: "#cbd5e1",
        fontSize: 16,
        padding: "0 4px",
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
      title="Arraste para reordenar"
    >
      ⠿
    </div>
  );
}

// ─── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({ allTags, onAdd }: { allTags: string[]; onAdd: (tag: string) => void }) {
  const [val, setVal] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setVal(v);
    if (v.trim().length > 0) {
      const matches = allTags.filter((t) => t.toLowerCase().includes(v.toLowerCase()));
      setSuggestions(matches);
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const add = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    onAdd(t);
    setVal("");
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add(val);
    }
    if (e.key === "Escape") setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <input
        value={val}
        onChange={handleChange}
        onKeyDown={handleKey}
        onFocus={() => val && setOpen(true)}
        placeholder="Adicionar tag de etapa..."
        style={{
          width: "100%",
          padding: "5px 10px",
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          fontSize: 12,
          outline: "none",
          background: C.surface,
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,.1)",
            marginTop: 2,
            maxHeight: 160,
            overflowY: "auto",
          }}
        >
          {suggestions.length > 0 &&
            suggestions.map((t) => (
              <div
                key={t}
                onMouseDown={() => add(t)}
                style={{
                  padding: "7px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  color: C.blue,
                  borderBottom: `1px solid ${C.border}`,
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = C.blueSoft)}
                onMouseOut={(e) => (e.currentTarget.style.background = "")}
              >
                {t}
              </div>
            ))}
          {val.trim() && !allTags.includes(val.trim()) && (
            <div
              onMouseDown={() => add(val)}
              style={{ padding: "7px 12px", fontSize: 12, cursor: "pointer", color: "#64748b" }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.surfaceAlt)}
              onMouseOut={(e) => (e.currentTarget.style.background = "")}
            >
              Criar tag <strong style={{ color: C.blue }}>"{val.trim()}"</strong>
            </div>
          )}
          {suggestions.length === 0 && !val.trim() && (
            <div style={{ padding: "7px 12px", fontSize: 12, color: "#94a3b8" }}>Nenhuma tag encontrada</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Abordagem (historico) ────────────────────────────────────────────────────
interface Abordagem {
  id: string;
  texto: string;
  data: string; // YYYY-MM-DD
  link?: string; // URL do documento/conteúdo
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Painel de histórico de abordagem ─────────────────────────────────────────
function AbordagemPanel({
  groupId,
  abordagens,
  onChange,
}: {
  groupId: string;
  abordagens: Record<string, Abordagem[]>;
  onChange: (abordagens: Record<string, Abordagem[]>) => void;
}) {
  const items = abordagens[groupId] || [];
  const ctr = useRef(Date.now());
  const [showForm, setShowForm] = useState(false);
  const [novoTexto, setNovoTexto] = useState("");
  const [novaData, setNovaData] = useState(new Date().toISOString().split("T")[0]);
  const [novoLink, setNovoLink] = useState("");

  const addAbordagem = () => {
    if (!novoTexto.trim()) return;
    const nova: Abordagem = {
      id: `ab_${ctr.current++}`,
      texto: novoTexto.trim(),
      data: novaData,
      link: novoLink.trim() || undefined,
    };
    onChange({ ...abordagens, [groupId]: [...items, nova] });
    setNovoTexto("");
    setNovaData(new Date().toISOString().split("T")[0]);
    setNovoLink("");
    setShowForm(false);
  };

  const deleteAbordagem = (id: string) => {
    onChange({ ...abordagens, [groupId]: items.filter((a) => a.id !== id) });
  };

  const updateAbordagem = (id: string, texto: string) => {
    onChange({ ...abordagens, [groupId]: items.map((a) => (a.id === id ? { ...a, texto } : a)) });
  };

  // Ordena por data mais recente primeiro
  const sorted = [...items].sort((a, b) => (b.data > a.data ? 1 : -1));

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px", background: "#fafbff" }}>
      {items.length === 0 && !showForm && (
        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 8 }}>
          Nenhuma abordagem registrada ainda.
        </p>
      )}

      {/* Lista de abordagens */}
      {sorted.map((ab) => (
        <div
          key={ab.id}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.blue, background: C.blueSoft, padding: "2px 8px", borderRadius: 99 }}>
              📅 {formatDate(ab.data)}
            </span>
            <button
              onClick={() => deleteAbordagem(ab.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 14 }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#cbd5e1")}
              title="Remover"
            >
              ×
            </button>
          </div>
          <textarea
            value={ab.texto}
            onChange={(e) => updateAbordagem(ab.id, e.target.value)}
            placeholder="Descreva a abordagem feita para este grupo..."
            rows={2}
            style={{
              width: "100%",
              padding: "6px 8px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              resize: "vertical",
              outline: "none",
              background: C.surfaceAlt,
              lineHeight: 1.4,
              boxSizing: "border-box",
              color: "#374151",
            }}
          />
          {ab.link && (
            <a
              href={ab.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: C.blue, display: "flex", alignItems: "center", gap: 4, marginTop: 6, textDecoration: "none" }}
            >
              🔗 {ab.link.length > 50 ? ab.link.substring(0, 50) + "..." : ab.link}
            </a>
          )}
        </div>
      ))}

      {/* Formulário novo */}
      {showForm ? (
        <div
          style={{
            background: C.surface,
            border: `2px solid ${C.blue}`,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
              Data da abordagem
            </label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 12,
                outline: "none",
                background: C.surface,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
              Descrição da abordagem
            </label>
            <textarea
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
              placeholder="Ex: Enviamos e-mail com oferta especial de taxa para leads com perfil financeiro compatível..."
              rows={3}
              style={{
                width: "100%",
                padding: "6px 10px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 12,
                resize: "vertical",
                outline: "none",
                background: C.surface,
                lineHeight: 1.4,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
              Link do documento (opcional)
            </label>
            <input
              type="url"
              value={novoLink}
              onChange={(e) => setNovoLink(e.target.value)}
              placeholder="https://docs.google.com/..."
              style={{
                width: "100%",
                padding: "6px 10px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 12,
                outline: "none",
                background: C.surface,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={addAbordagem}
              disabled={!novoTexto.trim()}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: "none",
                background: novoTexto.trim() ? C.blue : "#cbd5e1",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: novoTexto.trim() ? "pointer" : "not-allowed",
              }}
            >
              Salvar abordagem
            </button>
            <button
              onClick={() => { setShowForm(false); setNovoTexto(""); }}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: "#64748b",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 8,
            border: `1.5px dashed ${C.blue}`,
            background: "transparent",
            color: C.blue,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Registrar nova abordagem
        </button>
      )}
    </div>
  );
}

// ─── Group box ─────────────────────────────────────────────────────────────────
function GroupBox({
  group,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onRename,
  onDelete,
  onMoveSection,
  abordagens,
  onAbordagensChange,
  section,
}: {
  group: Group;
  dragging: string | null;
  onDragStart: (cid: string, gid: string) => void;
  onDragEnd: () => void;
  onDrop: (toGid: string, toSection: string) => void;
  onRename: (gid: string, label: string) => void;
  onDelete: (gid: string) => void;
  onMoveSection: (gid: string, newSection: string) => void;
  abordagens: Record<string, Abordagem[]>;
  onAbordagensChange: (abordagens: Record<string, Abordagem[]>) => void;
  section: string;
}) {
  const [over, setOver] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(group.label);
  const [showAbordagens, setShowAbordagens] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  const finishRename = () => {
    onRename(group.id, renameVal.trim() || group.label);
    setRenaming(false);
  };
  const abordagemCount = (abordagens[group.id] || []).length;
  const sectionColor = getSectionColor(section);
  const sectionBorderColor = getSectionBorderColor(section);

  return (
    <div
      style={{
        background: C.surface,
        border: `1.5px solid ${over ? sectionColor : sectionBorderColor}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        transition: "border-color .15s, opacity .15s",
        boxShadow: over ? `0 0 0 3px ${sectionColor}33` : "none",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={() => {
        setOver(false);
        onDrop(group.id, section);
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: `2px solid ${sectionBorderColor}`,
          background: getSectionBg(section),
          borderRadius: "9px 9px 0 0",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: sectionColor,
            background: `${sectionColor}15`,
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {getSectionLabel(section)}
        </span>
        {renaming ? (
          <input
            ref={renameRef}
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={finishRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") finishRename();
              if (e.key === "Escape") {
                setRenaming(false);
                setRenameVal(group.label);
              }
            }}
            style={{
              flex: 1,
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 6px",
              border: `1px solid ${C.blue}`,
              borderRadius: 4,
              outline: "none",
              background: C.surface,
              textTransform: "uppercase",
              letterSpacing: ".05em",
              color: "#64748b",
            }}
          />
        ) : (
          <span
            onClick={() => {
              setRenaming(true);
              setRenameVal(group.label);
            }}
            title="Clique para renomear"
            style={{
              flex: 1,
              fontSize: 10,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: ".06em",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {group.label}
          </span>
        )}
        <span
          style={{
            fontSize: 10,
            color: "#94a3b8",
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 99,
            padding: "1px 6px",
            flexShrink: 0,
          }}
        >
          {group.cards.length}
        </span>
        <button
          onClick={() => onDelete(group.id)}
          title="Remover grupo"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#cbd5e1",
            fontSize: 14,
            lineHeight: 1,
            padding: "0 2px",
            flexShrink: 0,
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#cbd5e1")}
        >
          ×
        </button>
        <button
          onClick={() => onMoveSection(group.id, getNextSection(section))}
          title="Mover para outra seção"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#cbd5e1",
            fontSize: 11,
            padding: "2px 6px",
            flexShrink: 0,
            borderRadius: 4,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = section === "naoFazer" ? "#dcfce7" : "#fee2e2";
            e.currentTarget.style.color = section === "naoFazer" ? "#22c55e" : "#ef4444";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#cbd5e1";
          }}
        >
          {section === "naoFazer" ? "←" : "→"}
        </button>
      </div>

      {/* Cards */}
      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4, minHeight: 36 }}>
        {group.cards.map((cid) => {
          const card = CARDS[cid];
          if (!card) return null;
          const isSz = card.s === "sz";
          const isDragging = dragging === cid;
          return (
            <div
              key={cid}
              draggable
              onDragStart={() => onDragStart(cid, group.id)}
              onDragEnd={onDragEnd}
              style={{
                padding: "5px 7px",
                borderRadius: 5,
                fontSize: 11,
                lineHeight: 1.35,
                cursor: "grab",
                display: "flex",
                alignItems: "flex-start",
                gap: 5,
                userSelect: "none",
                opacity: isDragging ? 0.3 : 1,
                transition: "opacity .15s",
                background: isSz ? C.szBg : C.mkBg,
                border: `1px solid ${isSz ? C.szBorder : C.mkBorder}`,
                color: isSz ? C.szText : C.mkText,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  flexShrink: 0,
                  padding: "1px 3px",
                  borderRadius: 2,
                  marginTop: 1,
                  background: isSz ? C.szBadge : C.mkBadge,
                  color: isSz ? C.szBadgeText : C.mkBadgeText,
                }}
              >
                {isSz ? "SZ" : "MK"}
              </span>
              <span>{card.l}</span>
            </div>
          );
        })}
      </div>

      {/* Abordagens toggle */}
      <button
        onClick={() => setShowAbordagens((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 12px",
          fontSize: 11,
          fontWeight: 500,
          cursor: "pointer",
          background: "none",
          border: "none",
          borderTop: `1px solid ${C.border}`,
          color: abordagemCount > 0 ? C.blue : "#94a3b8",
          width: "100%",
          textAlign: "left",
        }}
      >
        <span>
          {showAbordagens ? "▾" : "▸"} &nbsp;
          {abordagemCount > 0 ? `${abordagemCount} abordagem${abordagemCount > 1 ? "s" : ""}` : "Abordagens"}
        </span>
        {abordagemCount > 0 && (
          <span
            style={{
              background: C.blueSoft,
              color: C.blue,
              border: `1px solid ${C.blueBorder}`,
              borderRadius: 99,
              padding: "1px 6px",
              fontSize: 10,
            }}
          >
            {abordagemCount}
          </span>
        )}
      </button>

      {showAbordagens && <AbordagemPanel groupId={group.id} abordagens={abordagens} onChange={onAbordagensChange} />}
    </div>
  );
}

// ─── Data sources header ──────────────────────────────────────────────────────
function DataSources() {
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto 24px",
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        borderRadius: 16,
        padding: "24px 32px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>📊</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Fontes de Dados</span>
        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>Base para classificação de losts</span>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <a
          href="https://seazone-fund.slack.com/docs/TDLTVAWQ6/F0891A2JX1S"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            padding: "12px 20px",
            textDecoration: "none",
            transition: "all .2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <span style={{ fontSize: 24 }}>💬</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>Motivos de Perda — Marketplace</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Slack • Seazone Fund</div>
          </div>
          <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: 14 }}>↗</span>
        </a>
        <a
          href="https://docs.google.com/spreadsheets/d/1J-aMXiH4P3pQ4nQlN79emsNBNSBx5sOp7JsILLGI_MY/edit?gid=956697078"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            padding: "12px 24px",
            textDecoration: "none",
            transition: "all .2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <span style={{ fontSize: 24 }}>📈</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>Motivos de Perda — SZI Lançamentos</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Google Sheets • Classificação SZ</div>
          </div>
          <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: 14 }}>↗</span>
        </a>
      </div>
    </div>
  );
}

// ─── Campanhas ─────────────────────────────────────────────────────────────────
interface Campanha {
  id: string;
  link: string;
  contexto: string;
  criadoEm: string;
}

function CampanhasPanel({ campanhas, onChange }: {
  campanhas: Campanha[];
  onChange: (c: Campanha[]) => void;
}) {
  const [link, setLink] = useState("");
  const [contexto, setContexto] = useState("");
  const ctr = useRef(Date.now());

  const adicionar = () => {
    if (!link.trim()) return;
    onChange([{ id: `camp_${ctr.current++}`, link: link.trim(), contexto: contexto.trim(), criadoEm: new Date().toISOString() }, ...campanhas]);
    setLink("");
    setContexto("");
  };

  const remover = (id: string) => onChange(campanhas.filter((c) => c.id !== id));

  const formatarData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>📣</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Nova Campanha</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Registre o link do conteúdo e o contexto da ação</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Link do conteúdo</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Cole aqui o link do conteúdo, artefato ou página..."
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = C.blue)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Contexto da ação</label>
            <textarea
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder="Ex: Campanha de repescagem para leads que perderam oportunidade no Batel Spot, enviada por e-mail no dia 01/06..."
              rows={3}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = C.blue)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <button
            onClick={adicionar}
            disabled={!link.trim()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: link.trim() ? C.blue : "#cbd5e1",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: link.trim() ? "pointer" : "not-allowed",
              alignSelf: "flex-start",
            }}
          >
            + Adicionar campanha
          </button>
        </div>
      </div>

      {campanhas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📣</div>
          <div style={{ fontSize: 13 }}>Nenhuma campanha registrada ainda.</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Use o formulário acima para adicionar.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {campanhas.map((camp) => (
            <div key={camp.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {camp.link && (
                    <a href={camp.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      🔗 {camp.link.length > 70 ? camp.link.substring(0, 70) + "..." : camp.link}
                    </a>
                  )}
                  {camp.contexto && <p style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{camp.contexto}</p>}
                  <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, display: "block" }}>Registrado em {formatarData(camp.criadoEm)}</span>
                </div>
                <button
                  onClick={() => remover(camp.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 18, flexShrink: 0, padding: "0 2px" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                  title="Remover"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main board component ──────────────────────────────────────────────────────
export function LostsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [abordagens, setAbordagens] = useState<Record<string, Abordagem[]>>({});
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [campanhas, setCampanhas] = useState([]);
  const [activeTab, setActiveTab] = useState("board");
  const [campanhas, setCampanhas] = useState([]);
  const [activeTab, setActiveTab] = useState("board");
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "campanhas">("board");
  const gctr = useRef(17);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lost_board_v2");
      if (saved) {
        const data = JSON.parse(saved);
        setGroups(data.groups || DEFAULT_GROUPS);
        setAbordagens(data.abordagens || {});
        setCampanhas(data.campanhas || []);
      } else {
        setGroups(DEFAULT_GROUPS);
      }
    } catch {
      setGroups(DEFAULT_GROUPS);
    }
    setLoading(false);
  }, []);

  // ── Save to localStorage and database ────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const data = { groups, abordagens, campanhas };
      // Save to localStorage
      try {
        localStorage.setItem("lost_board_v2", JSON.stringify(data));
      } catch {
        console.error("Erro ao salvar no localStorage");
      }
      // Save to database
      try {
        await fetch("/api/lost-board", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {
        console.error("Erro ao salvar no banco de dados");
      }
    }, 1000);
  }, [groups, abordagens]);

  useEffect(() => {
    if (!loading) scheduleSave();
  }, [groups, abordagens, loading, scheduleSave]);

  // ── Drag and drop ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((cid: string, gid: string) => {
    setDragging(cid);
    setDragFrom(gid);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragFrom(null);
  }, []);

  const handleDrop = useCallback(
    (toGid: string, _toSection: string) => {
      if (!dragging || !dragFrom) return;
      if (dragFrom === toGid) {
        setDragging(null);
        setDragFrom(null);
        return;
      }
      const next = groups.map((gr) => {
        if (gr.id === dragFrom) return { ...gr, cards: gr.cards.filter((c) => c !== dragging) };
        if (gr.id === toGid && !gr.cards.includes(dragging)) return { ...gr, cards: [...gr.cards, dragging] };
        return gr;
      });
      setGroups(next);
      setDragging(null);
      setDragFrom(null);
    },
    [dragging, dragFrom, groups]
  );

  // ── Group management ──────────────────────────────────────────────────────
  const renameGroup = useCallback(
    (gid: string, label: string) => {
      setGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, label } : g)));
    },
    []
  );

  const deleteGroup = useCallback(
    (gid: string) => {
      const g = groups.find((x) => x.id === gid);
      if (!g) return;
      const hasCards = g.cards.length > 0;
      if (hasCards && !confirm(`Remover o grupo "${g.label}"? Os cards serão movidos para "Sem Grupo".`))
        return;
      let next = groups.filter((x) => x.id !== gid);
      if (hasCards) {
        next = next.map((x) =>
          x.id === "g16" ? { ...x, cards: [...x.cards, ...g.cards] } : x
        );
      }
      setGroups(next);
      // Note: abordagens are preserved by group ID, so deleting a group keeps its history
    },
    [groups]
  );

  const addGroup = useCallback(
    (section: "curtoPrazo" | "longoPrazo" | "naoFazer" | "fazer" = "curtoPrazo") => {
      const newGroup: Group = {
        id: `g${gctr.current++}`,
        section,
        label: "Novo grupo",
        cards: [],
      };
      setGroups((prev) => [...prev, newGroup]);
    },
    []
  );

  const moveGroupSection = useCallback(
    (gid: string, newSection: string) => {
      setGroups((prev) =>
        prev.map((gr) => (gr.id === gid ? { ...gr, section: newSection as Group["section"] } : gr))
      );
    },
    []
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: 14,
        }}
      >
        Carregando board...
      </div>
    );
  }

  const curtoGroups = groups.filter(
    (g) => g.section === "curtoPrazo" || g.section === "fazer" || g.section == null
  );
  const longoGroups = groups.filter((g) => g.section === "longoPrazo");
  const naoFazerGroups = groups.filter((g) => g.section === "naoFazer");

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "20px 16px 48px" }}>
      {/* ── Back button ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto 24px" }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 0",
          }}
        >
          ← Voltar ao menu
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto 16px", display: "flex", gap: 4 }}>
        <button
          onClick={() => setActiveTab("board")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px 8px 0 0",
            border: "none",
            borderBottom: activeTab === "board" ? `2px solid ${C.blue}` : "2px solid transparent",
            background: activeTab === "board" ? "#fff" : "#e2e8f0",
            color: activeTab === "board" ? C.blue : "#64748b",
            fontWeight: activeTab === "board" ? 600 : 400,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Board de Lost
        </button>
        <button
          onClick={() => setActiveTab("campanhas")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px 8px 0 0",
            border: "none",
            borderBottom: activeTab === "campanhas" ? `2px solid ${C.blue}` : "2px solid transparent",
            background: activeTab === "campanhas" ? "#fff" : "#e2e8f0",
            color: activeTab === "campanhas" ? C.blue : "#64748b",
            fontWeight: activeTab === "campanhas" ? 600 : 400,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Campanhas
          {campanhas.length > 0 && (
            <span style={{ marginLeft: 6, background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
              {campanhas.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "campanhas" ? (
        <CampanhasPanel campanhas={campanhas} onChange={setCampanhas} />
      ) : (
        <>

      {/* ── Main Header ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#1e293b" }}>Motivos de Lost — Board</div>
          <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
              <span
                style={{
                  background: "#FAECE7",
                  color: "#993C1D",
                  border: "1px solid #F5C4B3",
                  padding: "2px 7px",
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                SZ
              </span>
              Lançamentos
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
              <span
                style={{
                  background: "#E6F1FB",
                  color: "#185FA5",
                  border: "1px solid #B5D4F4",
                  padding: "2px 7px",
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                MK
              </span>
              Marketplace
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>✓ Salvo localmente</span>
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
          Arraste os cards entre grupos • Clique no nome do grupo para renomear • Arraste mensagens para reordenar
          envio • Use as setas para mover grupos entre seções
        </p>
      </div>

      {/* ── SEÇÃO: CURTO PRAZO ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto 32px" }}>
        <div
          style={{
            background: C.curtoBg,
            border: `2px solid ${C.curtoBorder}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderBottom: `2px solid ${C.curtoBorder}`,
              background: `${C.curtoBorder}33`,
            }}
          >
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.curtoColor }}>Curto Prazo</div>
              <div style={{ fontSize: 11, color: "#92400e" }}>Ação imediata — urgência de contato</div>
            </div>
            <span
              style={{
                marginLeft: "auto",
                background: `${C.curtoColor}22`,
                color: C.curtoColor,
                border: `1px solid ${C.curtoColor}44`,
                borderRadius: 99,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {curtoGroups.length} grupo{curtoGroups.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
                alignItems: "start",
              }}
            >
              {curtoGroups.map((group) => (
                <GroupBox
                  key={group.id}
                  group={group}
                  section={group.section || "curtoPrazo"}
                  dragging={dragging}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onRename={renameGroup}
                  onDelete={deleteGroup}
                  onMoveSection={moveGroupSection}
                  abordagens={abordagens}
                  onAbordagensChange={setAbordagens}
                />
              ))}
            </div>
            {curtoGroups.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 20px", color: "#b45309" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
                <div style={{ fontSize: 12 }}>Nenhum grupo de curto prazo</div>
              </div>
            )}
          </div>
          <div
            style={{
              padding: "10px 16px",
              background: `${C.curtoBorder}33`,
              borderTop: `1px solid ${C.curtoBorder}55`,
            }}
          >
            <button
              onClick={() => addGroup("curtoPrazo")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: `1.5px dashed ${C.curtoColor}`,
                background: "transparent",
                color: C.curtoColor,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Novo grupo — Curto Prazo
            </button>
          </div>
        </div>
      </div>

      {/* ── SEÇÃO: LONGO PRAZO ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto 32px" }}>
        <div
          style={{
            background: C.longoBg,
            border: `2px solid ${C.longoBorder}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderBottom: `2px solid ${C.longoBorder}`,
              background: `${C.longoBorder}33`,
            }}
          >
            <span style={{ fontSize: 22 }}>📆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.longoColor }}>Longo Prazo</div>
              <div style={{ fontSize: 11, color: "#1e40af" }}>Planejamento — follow-up往后</div>
            </div>
            <span
              style={{
                marginLeft: "auto",
                background: `${C.longoColor}22`,
                color: C.longoColor,
                border: `1px solid ${C.longoColor}44`,
                borderRadius: 99,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {longoGroups.length} grupo{longoGroups.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
                alignItems: "start",
              }}
            >
              {longoGroups.map((group) => (
                <GroupBox
                  key={group.id}
                  group={group}
                  section="longoPrazo"
                  dragging={dragging}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onRename={renameGroup}
                  onDelete={deleteGroup}
                  onMoveSection={moveGroupSection}
                  abordagens={abordagens}
                  onAbordagensChange={setAbordagens}
                />
              ))}
            </div>
            {longoGroups.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 20px", color: "#1e40af" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📆</div>
                <div style={{ fontSize: 12 }}>Nenhum grupo de longo prazo</div>
              </div>
            )}
          </div>
          <div
            style={{
              padding: "10px 16px",
              background: `${C.longoBorder}33`,
              borderTop: `1px solid ${C.longoBorder}55`,
            }}
          >
            <button
              onClick={() => addGroup("longoPrazo")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: `1.5px dashed ${C.longoColor}`,
                background: "transparent",
                color: C.longoColor,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Novo grupo — Longo Prazo
            </button>
          </div>
        </div>
      </div>

      {/* ── SEÇÃO: NÃO FAZER ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            background: C.sectionNaoFazerBg,
            border: `2px solid ${C.sectionNaoFazerBorder}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderBottom: `3px solid ${C.sectionNaoFazer}`,
              background: C.sectionNaoFazerBg,
            }}
          >
            <span style={{ fontSize: 28 }}>⏸️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.sectionNaoFazer }}>Não Fazer Mensagem</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Motivos que não fazem sentido no momento para ativação</div>
            </div>
            <span
              style={{
                background: `${C.sectionNaoFazer}22`,
                color: C.sectionNaoFazer,
                border: `1px solid ${C.sectionNaoFazer}44`,
                borderRadius: 99,
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {naoFazerGroups.length} grupo{naoFazerGroups.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
                alignItems: "start",
              }}
            >
              {naoFazerGroups.map((group) => (
                <GroupBox
                  key={group.id}
                  group={group}
                  section="naoFazer"
                  dragging={dragging}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onRename={renameGroup}
                  onDelete={deleteGroup}
                  onMoveSection={moveGroupSection}
                  abordagens={abordagens}
                  onAbordagensChange={setAbordagens}
                />
              ))}
            </div>
            {naoFazerGroups.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div>Nenhum grupo nesta seção</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Use as setas nos grupos para mover para cá</div>
              </div>
            )}
          </div>
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button
              onClick={() => addGroup("naoFazer")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `1.5px dashed ${C.sectionNaoFazer}`,
                background: "transparent",
                color: C.sectionNaoFazer,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Novo grupo — Não Fazer
            </button>
          </div>
        </div>
      </div>
      )}
        </>
      </div>
    </div>
  );
}
