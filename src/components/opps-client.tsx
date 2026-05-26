"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  Plus,
  Trash2,
  MessageSquare,
  Mail,
  Check,
  Trophy,
  History,
  Edit2,
  X,
} from "lucide-react";

interface OppItem {
  id: string;
  nomeEmpreendimento: string;
  localizacao: string | null;
  preco: string | null;
  condicoes: string | null;
  destaque: boolean;
  tipoDestaque: string | null;
  justificativa: string | null;
  textoWhatsapp: string | null;
  textoEmail: string | null;
  observacoes: string | null;
  Disparado: boolean;
  dataDisparo: Date | null;
  comentarioDisparo: string | null;
}

interface OppSemana {
  id: string;
  weekStart: Date;
  metaSemana: number | null;
  observacoes: string | null;
  items: OppItem[];
}

interface Props {
  semanas: OppSemana[];
}

export function OppsClient({ semanas: initial }: Props) {
  const { user } = useUser();
  const [semanas, setSemanas] = useState(initial);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [editingJustificativa, setEditingJustificativa] = useState<string | null>(null);
  const [editJustificativaText, setEditJustificativaText] = useState("");
  const [newOpp, setNewOpp] = useState({
    nome: "",
    localizacao: "",
    preco: "",
    condicoes: "",
  });
  const [editWhatsapp, setEditWhatsapp] = useState<Record<string, string>>({});
  const [editEmail, setEditEmail] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [addingOpp, setAddingOpp] = useState(false);
  const [bulkOppText, setBulkOppText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [editingOpp, setEditingOpp] = useState<string | null>(null);
  const [editOppData, setEditOppData] = useState({ nome: "", preco: "", condicoes: "" });

  const activeSemana = semanas[activeWeekIdx];

  const formatWeek = (d: Date) => {
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(start.getDate() + 6);
    const opts = { day: "2-digit", month: "short", year: "numeric" } as const;
    return `${start.toLocaleDateString("pt-BR", opts)} – ${end.toLocaleDateString("pt-BR", opts)}`;
  };

  const formatShortDate = (d: Date) => {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const goPrev = () => setActiveWeekIdx((i) => Math.max(0, i - 1));
  const goNext = () => setActiveWeekIdx((i) => Math.min(semanas.length - 1, i + 1));

  const handleAddOpp = async () => {
    if (!newOpp.nome.trim() || !activeSemana) return;
    setAddingOpp(true);
    try {
      const result = await fetch('/api/opps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          semanaId: activeSemana.id,
          nomeEmpreendimento: newOpp.nome.trim(),
          localizacao: newOpp.localizacao || null,
          preco: newOpp.preco || null,
          condicoes: newOpp.condicoes || null,
          userId: user?.id,
        }),
      });
      const data = await result.json();
      if (!result.ok) {
        alert(data.error || "Erro ao criar");
        return;
      }
      const item = data.item;
      setSemanas((prev) =>
        prev.map((s, i) =>
          i === activeWeekIdx
            ? { ...s, items: [...s.items, { ...item, Disparado: false, comentarioDisparo: null }] }
            : s
        )
      );
      setNewOpp({ nome: "", localizacao: "", preco: "", condicoes: "" });
      window.location.reload();
    } finally {
      setAddingOpp(false);
    }
  };

  function parseBulkOpp(line: string): { nome: string; preco: string | null; condicoes: string } {
    let texto = line.trim();
    let preco: string | null = null;
    let condicoes: string[] = [];

    // Extract price - find R$ followed by numbers
    const precoMatch = texto.match(/(R\$\s*[\d\.,]+)/);
    if (precoMatch) {
      preco = precoMatch[1].trim();
    }

    // Keywords for conditions
    const keywords = [
      "ágio zero", "lançamento", "condição de lançamento", "condição lançamento",
      "entrega", "vista mar", "vista lateral", "garden", "garten",
      "parcelamento", "parcelas", "abaixo do mercado", "abaixo de mercado", "abaixo",
      "6x", "10x", "3x", "5x", "8x", "até 3x", "até 6x", "até 8x", "até 10x",
      "aceita", "previsão", "obra", "obras", "distrato", "beira-mar",
      "menor", "maior", "flexível", "flexivel", "flex",
      "checkout", "chekout", "cota mais", "cabana", "faturamento",
      "localização", "localizacao", "certeza", "certeza de parcelamento",
    ];

    // Find keywords in text
    const lowerTexto = texto.toLowerCase();
    for (const kw of keywords) {
      if (lowerTexto.includes(kw)) {
        const idx = lowerTexto.indexOf(kw);
        const start = Math.max(0, idx - 10);
        const end = Math.min(texto.length, idx + kw.length + 20);
        let context = texto.substring(start, end).trim();
        // Remove price from context if present
        context = context.replace(/R\$\s*[\d\.,]+/g, "").trim();
        if (context && context.length > 3) {
          // Clean trailing punctuation
          context = context.replace(/[;:\-]\s*$/, "").trim();
          if (!condicoes.includes(context)) {
            condicoes.push(context);
          }
        }
      }
    }

    // Nome is the whole line, cleaned
    let nome = texto
      .replace(/R\$\s*[\d\.,]+/g, "") // remove price
      .replace(/\s*;\s*/g, " ")       // remove semicolons
      .replace(/\s*:\s*/g, " - ")     // replace colon with dash
      .replace(/^\s*-\s*/, "")         // remove leading dash
      .replace(/\s+/g, " ")            // normalize spaces
      .trim();

    // If nome is empty or too short, use original
    if (nome.length < 3) {
      nome = texto.split(/[;:]/)[0].trim();
    }

    return {
      nome: nome.substring(0, 100), // limit nome length
      preco,
      condicoes: condicoes.join("; ")
    };
  }

  const handleAddBulkOpps = async () => {
    if (!bulkOppText.trim() || !activeSemana) return;
    setAddingOpp(true);
    setBulkError(null);
    setBulkSuccess(null);
    try {
      const lines = bulkOppText.split("\n").filter(l => l.trim());
      let added = 0;
      const errors: string[] = [];
      const parsed: { nome: string; preco: string | null; condicoes: string; original: string }[] = [];

      for (const line of lines) {
        const { nome, preco, condicoes } = parseBulkOpp(line);

        if (!nome || nome.length < 2) {
          errors.push(`Não consegui entender: "${line.substring(0, 50)}..."`);
          continue;
        }

        parsed.push({ nome, preco, condicoes, original: line });
      }

      if (errors.length > 0 && parsed.length === 0) {
        setBulkError(`Não consegui entender nenhuma linha:\n${errors.join("\n")}`);
        return;
      }

      // Create all opps
      for (const p of parsed) {
        const result = await fetch('/api/opps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            semanaId: activeSemana.id,
            nomeEmpreendimento: p.nome.trim(),
            localizacao: null,
            preco: p.preco,
            condicoes: p.condicoes || null,
          }),
        });

        if (result.ok) {
          added++;
        } else {
          const data = await result.json();
          errors.push(`${p.nome}: ${data.error || "erro"}`);
        }
      }

      setBulkOppText("");
      if (added > 0) {
        setBulkSuccess(`${added} opps adicionadas com sucesso!`);
        setTimeout(() => window.location.reload(), 1500);
      }
      if (errors.length > 0) {
        setBulkError(`Erros:\n${errors.join("\n")}`);
      }
    } finally {
      setAddingOpp(false);
    }
  };

  const handleToggleDestaque = async (item: OppItem) => {
    const currentDestaques = semanas[activeWeekIdx].items.filter((i) => i.destaque).length;

    if (!item.destaque && currentDestaques >= 2) {
      alert("Máximo de 2 oportunidades selecionadas por semana");
      return;
    }

    const result = await fetch('/api/opps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-destaque', id: item.id }),
    });
    const data = await result.json();
    if (!result.ok) {
      alert(data.error || "Erro ao atualizar");
      return;
    }

    const newDestaque = !item.destaque;
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === item.id ? { ...it, destaque: newDestaque } : it
              ),
            }
          : s
      )
    );
  };

  const handleSaveJustificativa = async (item: OppItem) => {
    if (!editJustificativaText.trim()) return;
    await fetch('/api/opps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-justificativa', id: item.id, justificativa: editJustificativaText.trim() }),
    });
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === item.id ? { ...it, justificativa: editJustificativaText.trim() } : it
              ),
            }
          : s
      )
    );
    setEditingJustificativa(null);
    setEditJustificativaText("");
  };

  const handleUpdateTexto = (
    id: string,
    field: "textoWhatsapp" | "textoEmail",
    value: string
  ) => {
    if (field === "textoWhatsapp") {
      setEditWhatsapp((p) => ({ ...p, [id]: value }));
    } else {
      setEditEmail((p) => ({ ...p, [id]: value }));
    }
  };

  const handleSaveTexto = async (
    item: OppItem,
    field: "textoWhatsapp" | "textoEmail"
  ) => {
    const value = field === "textoWhatsapp" ? editWhatsapp[item.id] : editEmail[item.id];
    if (value === undefined) return;
    setSaving(item.id);
    try {
      await fetch('/api/opps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-texto', id: item.id, field, value }),
      });
      setSemanas((prev) =>
        prev.map((s, i) =>
          i === activeWeekIdx
            ? {
                ...s,
                items: s.items.map((it) =>
                  it.id === item.id ? { ...it, [field]: value } : it
                ),
              }
            : s
        )
      );
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteOpp = async (item: OppItem) => {
    if (!confirm("Excluir esta oportunidade?")) return;
    await fetch('/api/opps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: item.id }),
    });
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx
          ? { ...s, items: s.items.filter((it) => it.id !== item.id) }
          : s
      )
    );
  };

  const handleStartEditOpp = (item: OppItem) => {
    setEditingOpp(item.id);
    setEditOppData({
      nome: item.nomeEmpreendimento,
      preco: item.preco || "",
      condicoes: item.condicoes || "",
    });
  };

  const handleSaveEditOpp = async (item: OppItem) => {
    const result = await fetch('/api/opps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update-texto',
        id: item.id,
        field: 'nomeEmpreendimento',
        value: editOppData.nome,
      }),
    });

    if (result.ok) {
      await fetch('/api/opps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-texto',
          id: item.id,
          field: 'preco',
          value: editOppData.preco,
        }),
      });

      await fetch('/api/opps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-texto',
          id: item.id,
          field: 'condicoes',
          value: editOppData.condicoes,
        }),
      });

      setSemanas((prev) =>
        prev.map((s, i) =>
          i === activeWeekIdx
            ? {
                ...s,
                items: s.items.map((it) =>
                  it.id === item.id
                    ? {
                        ...it,
                        nomeEmpreendimento: editOppData.nome,
                        preco: editOppData.preco || null,
                        condicoes: editOppData.condicoes || null,
                      }
                    : it
                ),
              }
            : s
        )
      );
    }

    setEditingOpp(null);
  };

  const handleCancelEditOpp = () => {
    setEditingOpp(null);
    setEditOppData({ nome: "", preco: "", condicoes: "" });
  };

  const destaques = activeSemana?.items.filter((i) => i.destaque) ?? [];
  const naoDestaques = activeSemana?.items.filter((i) => !i.destaque) ?? [];

  // History: all weeks with selected opps
  const historyData = useMemo(() => {
    return semanas
      .filter((s) => s.items.some((i) => i.destaque))
      .map((s) => ({
        week: formatShortDate(new Date(s.weekStart)),
        fullWeek: formatWeek(new Date(s.weekStart)),
        selected: s.items.filter((i) => i.destaque).map((i) => ({
          name: i.nomeEmpreendimento,
          justificativa: i.justificativa,
        })),
      }))
      .sort((a, b) => new Date(b.fullWeek).getTime() - new Date(a.fullWeek).getTime());
  }, [semanas]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Opps da Semana
        </h1>
        <p className="text-gray-500">
          Selecione as 2 melhores oportunidades da semana e crie os textos
        </p>
      </div>

      {/* Seletor de semana e histórico */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goPrev} disabled={activeWeekIdx === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium text-gray-700 min-w-[200px] text-center">
            {activeSemana ? formatWeek(new Date(activeSemana.weekStart)) : "—"}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            disabled={activeWeekIdx >= semanas.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant={showHistory ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="w-4 h-4" />
          {showHistory ? "Ocultar histórico" : "Ver histórico"}
        </Button>
      </div>

      {/* Histórico */}
      {showHistory && (
        <Card className="mb-6 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de Opps Selecionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma opp selecionada ainda
              </p>
            ) : (
              <div className="space-y-3">
                {historyData.map((entry, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-sm text-gray-700 mb-1">{entry.fullWeek}</p>
                    <div className="flex gap-4">
                      {entry.selected.map((sel, selIdx) => (
                        <div key={selIdx} className="flex-1 bg-white rounded-lg p-2 border">
                          <p className="font-medium text-sm text-blue-600">{sel.name}</p>
                          {sel.justificativa && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sel.justificativa}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumo da semana */}
      {activeSemana && (
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {activeSemana.items.length} oportunidades esta semana
                  </p>
                  <p className="text-xs text-gray-500">
                    {destaques.length === 2
                      ? "2 selecionadas para destaque"
                      : destaques.length > 0
                      ? `${destaques.length} de 2 selecionadas`
                      : "Nenhuma selecionada"}
                  </p>
                </div>
                {destaques.length === 2 && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Completo
                  </Badge>
                )}
              </div>
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adicionar novas opps em lote */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Colar Opps da Semana</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Cole a lista de opps, uma por linha. O sistema extrai o nome, preço e condições automaticamente.
          </p>
        </CardHeader>
        <CardContent>
          {bulkError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 whitespace-pre-wrap">{bulkError}</p>
            </div>
          )}
          {bulkSuccess && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{bulkSuccess}</p>
            </div>
          )}
          <Textarea
            placeholder={`Cole aqui as opps, uma por linha:\nExemplo:\nSantinho Spot - 309B: R$ 289.000,02 ; ágio zero; parcela entrada até 3x\nCanasvieiras Spot - 211: R$ 263.871,91; aceita parcelamento; 7% abaixo do valor de mercado`}
            value={bulkOppText}
            onChange={(e) => { setBulkOppText(e.target.value); setBulkError(null); setBulkSuccess(null); }}
            rows={6}
            className="text-sm font-mono"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleAddBulkOpps}
              disabled={addingOpp || !bulkOppText.trim()}
            >
              <Plus className="w-4 h-4" />
              {addingOpp ? "Adicionando..." : "Adicionar Opps"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de todas as opps */}
      {activeSemana?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma oportunidade cadastrada esta semana.</p>
          <p className="text-sm">Adicione acima as 8 opps recebidas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Em destaque (selecionadas) */}
          {destaques.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Selecionadas ({destaques.length}/2)
              </h2>
              <div className="space-y-4">
                {destaques.map((item, idx) => (
                  <Card key={item.id} className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                            #{idx + 1}
                          </span>
                          <div>
                            <CardTitle className="text-lg">{item.nomeEmpreendimento}</CardTitle>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.localizacao && (
                                <Badge variant="secondary">{item.localizacao}</Badge>
                              )}
                              {item.preco && (
                                <Badge variant="secondary" className="font-mono">{item.preco}</Badge>
                              )}
                              {item.condicoes && (
                                <Badge variant="outline">{item.condicoes}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleDestaque(item)}
                            className="text-yellow-600"
                          >
                            <StarOff className="w-4 h-4" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Justificativa */}
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Edit2 className="w-3 h-3" />
                            Justificativa da escolha
                          </label>
                          {editingJustificativa === item.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleSaveJustificativa(item)}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingJustificativa(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingJustificativa(item.id);
                                setEditJustificativaText(item.justificativa || "");
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        {editingJustificativa === item.id ? (
                          <Textarea
                            value={editJustificativaText}
                            onChange={(e) => setEditJustificativaText(e.target.value)}
                            placeholder="Por que você escolheu esta opp? (ex: 41% abaixo do mercado, entrega esse ano...)"
                            rows={3}
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {item.justificativa || "Clique em editar para adicionar a justificativa..."}
                          </p>
                        )}
                      </div>

                      {/* WhatsApp */}
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-green-700 flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            Texto WhatsApp
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveTexto(item, "textoWhatsapp")}
                            disabled={saving === item.id}
                            className="text-green-700 border-green-300"
                          >
                            Salvar
                          </Button>
                        </div>
                        <Textarea
                          value={
                            editWhatsapp[item.id] !== undefined
                              ? editWhatsapp[item.id]
                              : item.textoWhatsapp ?? ""
                          }
                          onChange={(e) => handleUpdateTexto(item.id, "textoWhatsapp", e.target.value)}
                          placeholder="Cole aqui o texto de WhatsApp..."
                          rows={6}
                          className="text-sm bg-white"
                        />
                      </div>

                      {/* E-mail */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-blue-700 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            Texto E-mail
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveTexto(item, "textoEmail")}
                            disabled={saving === item.id}
                            className="text-blue-700 border-blue-300"
                          >
                            Salvar
                          </Button>
                        </div>
                        <Textarea
                          value={
                            editEmail[item.id] !== undefined
                              ? editEmail[item.id]
                              : item.textoEmail ?? ""
                          }
                          onChange={(e) => handleUpdateTexto(item.id, "textoEmail", e.target.value)}
                          placeholder="Cole aqui o texto de e-mail..."
                          rows={6}
                          className="text-sm bg-white"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Demais opps (não selecionadas) */}
          {naoDestaques.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Outras Oportunidades ({naoDestaques.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {naoDestaques.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {editingOpp === item.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editOppData.nome}
                            onChange={(e) => setEditOppData({ ...editOppData, nome: e.target.value })}
                            placeholder="Nome do empreendimento"
                            className="text-sm"
                          />
                          <Input
                            value={editOppData.preco}
                            onChange={(e) => setEditOppData({ ...editOppData, preco: e.target.value })}
                            placeholder="Preço (ex: R$ 263.871,91)"
                            className="text-sm"
                          />
                          <Input
                            value={editOppData.condicoes}
                            onChange={(e) => setEditOppData({ ...editOppData, condicoes: e.target.value })}
                            placeholder="Condições (ex: 6x, ágio zero)"
                            className="text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={handleCancelEditOpp}>
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={() => handleSaveEditOpp(item)}>
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.nomeEmpreendimento}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.localizacao && (
                                <span className="text-xs text-gray-500">{item.localizacao}</span>
                              )}
                              {item.preco && (
                                <span className="text-xs font-mono bg-gray-100 px-1 rounded">{item.preco}</span>
                              )}
                              {item.condicoes && (
                                <span className="text-xs text-gray-600">{item.condicoes}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEditOpp(item)}
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {destaques.length < 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleDestaque(item)}
                                className="text-yellow-600 border-yellow-300"
                              >
                                <Star className="w-4 h-4" />
                                Selecionar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpp(item)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}