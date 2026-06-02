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

interface Abordagem {
  id: string;
  texto: string;
  data: string;
  link?: string;
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

function GroupBox({ group, dragging, onDragStart, onDragEnd, onDrop, onRename, onDelete, onMoveSection, abordagens, onAbordagensChange, section }: any) {
  const [over, setOver] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(group.label);
  const [showAbordagens, setShowAbordagens] = useState(false);
  const finishRename = () => { onRename(group.id, renameVal.trim() || group.label); setRenaming(false); };
  const sectionColor = section === "curtoPrazo" ? C.curtoColor : section === "longoPrazo" ? C.longoColor : C.sectionNaoFazer;
  const sectionBg = section === "curtoPrazo" ? C.curtoBg : section === "longoPrazo" ? C.longoBg : C.sectionNaoFazerBg;
  const sectionBorder = section === "curtoPrazo" ? C.curtoBorder : section === "longoPrazo" ? C.longoBorder : C.sectionNaoFazerBorder;

  return (
    <div
      style={{ background: "#fff", border: `1.5px solid ${over ? sectionColor : sectionBorder}`, borderRadius: 10, display: "flex", flexDirection: "column" }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { setOver(false); onDrop(group.id, section); }}
    >
      <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, borderBottom: `1px solid ${sectionBorder}`, background: sectionBg, borderRadius: "9px 9px 0 0" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: sectionColor }}>{section.toUpperCase()}</span>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "#64748b" }}>{group.label}</span>
        <span style={{ fontSize: 10, color: "#94a3b8", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 99, padding: "1px 6px" }}>{group.cards.length}</span>
      </div>
      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4, minHeight: 40 }}>
        {group.cards.map((cid: string) => {
          const card = CARDS[cid];
          if(!card) return null;
          return (
            <div key={cid} draggable onDragStart={() => onDragStart(cid, group.id)} onDragEnd={onDragEnd} style={{ padding: "5px 7px", borderRadius: 5, fontSize: 11, background: card.s === "sz" ? C.szBg : C.mkBg, border: `1px solid ${card.s === "sz" ? C.szBorder : C.mkBorder}`, color: card.s === "sz" ? C.szText : C.mkText, cursor: "grab", opacity: dragging === cid ? 0.3 : 1 }}>
              <span style={{ fontSize: 9, fontWeight: 700, marginRight: 4 }}>{card.s.toUpperCase()}</span>
              {card.l}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataSources() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto 24px", background: "#1e293b", borderRadius: 16, padding: "20px 24px", color: "#fff" }}>
      <div style={{ display: "flex", gap: 16 }}>
        <a href="https://docs.google.com/spreadsheets/d/1J-aMXiH4P3pQ4nQlN79emsNBNSBx5sOp7JsILLGI_MY/edit" target="_blank" style={{ color: "#fff", textDecoration: "none", fontSize: 13 }}>📊 Sheets Losts</a>
        <a href="https://seazone-fund.slack.com/docs/TDLTVAWQ6/F0891A2JX1S" target="_blank" style={{ color: "#fff", textDecoration: "none", fontSize: 13 }}>💬 Slack Motivos</a>
      </div>
    </div>
  );
}

function CampanhasPanel({ campanhas, setCampanhas }: any) {
  const [link, setLink] = useState("");
  const [contexto, setContexto] = useState("");
  const adicionar = () => {
    if(!link) return;
    setCampanhas([{id: Date.now().toString(), link, contexto}, ...campanhas]);
    setLink(""); setContexto("");
  };
  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📣 Nova Campanha</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="Link do conteúdo..." style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <textarea value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Contexto da ação..." rows={3} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <button onClick={adicionar} style={{ padding: "10px 20px", background: C.blue, color: "#fff", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 }}>Adicionar Campanha</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {campanhas.map((c: any) => (
          <div key={c.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <a href={c.link} target="_blank" style={{ color: C.blue, fontWeight: 700, textDecoration: "none", display: "block", marginBottom: 4 }}>🔗 {c.link}</a>
            <p style={{ fontSize: 13, color: "#475569" }}>{c.contexto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LostsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [abordagens, setAbordagens] = useState<Record<string, Abordagem[]>>({});
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"board" | "campanhas">("board");
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lost_board_v2");
    if(saved) {
      const data = JSON.parse(saved);
      setGroups(data.groups || DEFAULT_GROUPS);
      setAbordagens(data.abordagens || {});
      setCampanhas(data.campanhas || []);
    } else {
      setGroups(DEFAULT_GROUPS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if(!loading) {
      localStorage.setItem("lost_board_v2", JSON.stringify({ groups, abordagens, campanhas }));
    }
  }, [groups, abordagens, campanhas, loading]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Carregando...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "20px 16px 48px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto 24px" }}>
        <BackButton />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto 20px", display: "flex", gap: 10 }}>
        <button onClick={() => setActiveTab("board")} style={{ padding: "8px 20px", background: activeTab === "board" ? "#fff" : "transparent", border: activeTab === "board" ? "1px solid #e2e8f0" : "none", borderRadius: 8, cursor: "pointer", fontWeight: activeTab === "board" ? 600 : 400 }}>Board de Lost</button>
        <button onClick={() => setActiveTab("campanhas")} style={{ padding: "8px 20px", background: activeTab === "campanhas" ? "#fff" : "transparent", border: activeTab === "campanhas" ? "1px solid #e2e8f0" : "none", borderRadius: 8, cursor: "pointer", fontWeight: activeTab === "campanhas" ? 600 : 400 }}>Campanhas {campanhas.length > 0 && `(${campanhas.length})`}</button>
      </div>

      {activeTab === "campanhas" ? (
        <CampanhasPanel campanhas={campanhas} setCampanhas={setCampanhas} />
      ) : (
        <>
          <DataSources />
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
            {["curtoPrazo", "longoPrazo", "naoFazer"].map(section => (
              <div key={section} style={{ background: section === "curtoPrazo" ? C.curtoBg : section === "longoPrazo" ? C.longoBg : C.sectionNaoFazerBg, padding: 16, borderRadius: 16, border: `2px solid ${section === "curtoPrazo" ? C.curtoBorder : section === "longoPrazo" ? C.longoBorder : C.sectionNaoFazerBorder}` }}>
                <h2 style={{ fontWeight: 700, color: section === "curtoPrazo" ? C.curtoColor : section === "longoPrazo" ? C.longoColor : C.sectionNaoFazer, marginBottom: 12 }}>{section === "curtoPrazo" ? "⚡ Curto Prazo" : section === "longoPrazo" ? "📆 Longo Prazo" : "⏸️ Não Fazer"}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {groups.filter(g => g.section === section).map(group => (
                    <GroupBox key={group.id} group={group} section={section} dragging={dragging} onDragStart={(cid:any, gid:any) => {setDragging(cid); setDragFrom(gid);}} onDragEnd={() => setDragging(null)} onDrop={(toGid:any) => {
                      if(!dragging || !dragFrom || dragFrom === toGid) return;
                      setGroups(groups.map(g => {
                        if(g.id === dragFrom) return {...g, cards: g.cards.filter(c => c !== dragging)};
                        if(g.id === toGid) return {...g, cards: [...g.cards, dragging]};
                        return g;
                      }));
                    }} onRename={(gid:any, label:any) => setGroups(groups.map(g => g.id === gid ? {...g, label} : g))} onDelete={(gid:any) => setGroups(groups.filter(g => g.id !== gid))} onMoveSection={() => {}} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
