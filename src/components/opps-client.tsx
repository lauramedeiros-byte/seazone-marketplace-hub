"use client";

import { useState, useMemo } from "react";
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
  Plus,
  Trash2,
  MessageSquare,
  Mail,
  Check,
  History,
  Edit2,
  X,
  ExternalLink,
  Clock,
  Users,
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
  const [editWhatsapp, setEditWhatsapp] = useState<Record<string, string>>({});
  const [editEmail, setEditEmail] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [addingOpp, setAddingOpp] = useState(false);
  const [bulkOppText, setBulkOppText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingOpp, setEditingOpp] = useState<string | null>(null);
  const [editOppData, setEditOppData] = useState({ nome: "", preco: "", condicoes: "" });

  const activeSemana = semanas[activeWeekIdx];
  const prevSemana = semanas[activeWeekIdx + 1];

  const formatWeek = (d: Date) => {
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(start.getDate() + 6);
    const opts = { day: "2-digit", month: "short" } as const;
    return `${start.toLocaleDateString("pt-BR", opts)} – ${end.toLocaleDateString("pt-BR", { ...opts, year: "numeric" })}`;
  };

  const goPrev = () => setActiveWeekIdx((i) => Math.max(0, i - 1));
  const goNext = () => setActiveWeekIdx((i) => Math.min(semanas.length - 1, i + 1));

  // ── Grupos da semana ativa ──────────────────────────────────────────────
  // Bloco 1: as opps que subiram nesta semana (não são cópias vindas da semana anterior)
  const oppsDaSemana = (activeSemana?.items ?? []).filter((i) => i.tipoDestaque !== "semana-anterior");
  // Bloco 3: as escolhidas para publicar (destaque)
  const escolhidas = (activeSemana?.items ?? []).filter((i) => i.destaque);
  // Bloco 2: opps da semana passada (também não são cópias)
  const oppsSemanaPassada = (prevSemana?.items ?? []).filter((i) => i.tipoDestaque !== "semana-anterior");
  const podeEscolherMais = escolhidas.length < 2;
  // Nomes já trazidos da semana passada (para marcar como "escolhida" no bloco 2)
  const nomesTrazidos = new Set(
    (activeSemana?.items ?? [])
      .filter((i) => i.tipoDestaque === "semana-anterior")
      .map((i) => i.nomeEmpreendimento)
  );

  function parseBulkOpp(line: string): { nome: string; preco: string | null; condicoes: string } {
    const texto = line.trim();
    let preco: string | null = null;
    const condicoes: string[] = [];

    const precoMatch = texto.match(/(R\$\s*[\d\.,]+)/);
    if (precoMatch) {
      preco = precoMatch[1].trim();
    }

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

    const lowerTexto = texto.toLowerCase();
    for (const kw of keywords) {
      if (lowerTexto.includes(kw)) {
        const idx = lowerTexto.indexOf(kw);
        const start = Math.max(0, idx - 10);
        const end = Math.min(texto.length, idx + kw.length + 20);
        let context = texto.substring(start, end).trim();
        context = context.replace(/R\$\s*[\d\.,]+/g, "").trim();
        if (context && context.length > 3) {
          context = context.replace(/[;:\-]\s*$/, "").trim();
          if (!condicoes.includes(context)) {
            condicoes.push(context);
          }
        }
      }
    }

    let nome = texto
      .replace(/R\$\s*[\d\.,]+/g, "")
      .replace(/\s*;\s*/g, " ")
      .replace(/\s*:\s*/g, " - ")
      .replace(/^\s*-\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (nome.length < 3) {
      nome = texto.split(/[;:]/)[0].trim();
    }

    return {
      nome: nome.substring(0, 100),
      preco,
      condicoes: condicoes.join("; "),
    };
  }

  const handleAddBulkOpps = async () => {
    if (!bulkOppText.trim() || !activeSemana) return;
    setAddingOpp(true);
    setBulkError(null);
    setBulkSuccess(null);
    try {
      const lines = bulkOppText.split("\n").filter((l) => l.trim());
      let added = 0;
      const errors: string[] = [];
      const parsed: { nome: string; preco: string | null; condicoes: string }[] = [];

      for (const line of lines) {
        const { nome, preco, condicoes } = parseBulkOpp(line);
        if (!nome || nome.length < 2) {
          errors.push(`Não consegui entender: "${line.substring(0, 50)}..."`);
          continue;
        }
        parsed.push({ nome, preco, condicoes });
      }

      if (errors.length > 0 && parsed.length === 0) {
        setBulkError(`Não consegui entender nenhuma linha:\n${errors.join("\n")}`);
        return;
      }

      for (const p of parsed) {
        const result = await fetch("/api/opps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
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
          const d = await result.json();
          errors.push(`${p.nome}: ${d.error || "erro"}`);
        }
      }

      setBulkOppText("");
      if (added > 0) {
        setBulkSuccess(`${added} opps adicionadas com sucesso!`);
        setTimeout(() => window.location.reload(), 1200);
      }
      if (errors.length > 0) {
        setBulkError(`Erros:\n${errors.join("\n")}`);
      }
    } finally {
      setAddingOpp(false);
    }
  };

  const patchItem = (id: string, patch: Partial<OppItem>) => {
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx
          ? { ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }
          : s
      )
    );
  };

  const handleToggleDestaque = async (item: OppItem) => {
    if (!item.destaque && !podeEscolherMais) {
      alert("Máximo de 2 opps escolhidas por semana");
      return;
    }
    setBusyId(item.id);
    try {
      const result = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-destaque", id: item.id }),
      });
      const data = await result.json();
      if (!result.ok) {
        alert(data.error || "Erro ao atualizar");
        return;
      }
      patchItem(item.id, { destaque: !item.destaque });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleMonica = async (item: OppItem) => {
    setBusyId(item.id);
    try {
      const isMonica = item.tipoDestaque === "monica";
      const result = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-monica", id: item.id }),
      });
      const data = await result.json();
      if (!result.ok) {
        alert(data.error || "Erro ao atualizar");
        return;
      }
      patchItem(item.id, { tipoDestaque: isMonica ? null : "monica", destaque: isMonica ? item.destaque : false });
    } finally {
      setBusyId(null);
    }
  };

  const handleChoosePrev = async (item: OppItem) => {
    if (!activeSemana) return;
    if (!podeEscolherMais) {
      alert("Máximo de 2 opps escolhidas por semana");
      return;
    }
    setBusyId(item.id);
    try {
      const result = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "choose-prev",
          semanaId: activeSemana.id,
          sourceId: item.id,
        }),
      });
      const data = await result.json();
      if (!result.ok) {
        alert(data.error || "Erro ao escolher");
        return;
      }
      setSemanas((prev) =>
        prev.map((s, i) =>
          i === activeWeekIdx
            ? { ...s, items: [...s.items, { ...data.item, Disparado: false, comentarioDisparo: null }] }
            : s
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveChosen = async (item: OppItem) => {
    setBusyId(item.id);
    try {
      if (item.tipoDestaque === "semana-anterior") {
        // veio da semana passada: era só uma cópia para escolha → apaga
        await fetch("/api/opps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id: item.id }),
        });
        setSemanas((prev) =>
          prev.map((s, i) =>
            i === activeWeekIdx ? { ...s, items: s.items.filter((it) => it.id !== item.id) } : s
          )
        );
      } else {
        // opp desta semana: só tira o destaque, mantém na lista
        await fetch("/api/opps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle-destaque", id: item.id }),
        });
        patchItem(item.id, { destaque: false });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateTexto = (id: string, field: "textoWhatsapp" | "textoEmail", value: string) => {
    if (field === "textoWhatsapp") {
      setEditWhatsapp((p) => ({ ...p, [id]: value }));
    } else {
      setEditEmail((p) => ({ ...p, [id]: value }));
    }
  };

  const handleSaveTexto = async (item: OppItem, field: "textoWhatsapp" | "textoEmail") => {
    const value = field === "textoWhatsapp" ? editWhatsapp[item.id] : editEmail[item.id];
    if (value === undefined) return;
    setSaving(item.id + field);
    try {
      await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-texto", id: item.id, field, value }),
      });
      patchItem(item.id, { [field]: value } as Partial<OppItem>);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteOpp = async (item: OppItem) => {
    if (!confirm("Excluir esta oportunidade?")) return;
    await fetch("/api/opps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: item.id }),
    });
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx ? { ...s, items: s.items.filter((it) => it.id !== item.id) } : s
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
    for (const [field, value] of [
      ["nomeEmpreendimento", editOppData.nome],
      ["preco", editOppData.preco],
      ["condicoes", editOppData.condicoes],
    ] as const) {
      await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-texto", id: item.id, field, value }),
      });
    }
    patchItem(item.id, {
      nomeEmpreendimento: editOppData.nome,
      preco: editOppData.preco || null,
      condicoes: editOppData.condicoes || null,
    });
    setEditingOpp(null);
  };

  // Histórico: semanas com opps escolhidas
  const historyData = useMemo(() => {
    return semanas
      .filter((s) => s.items.some((i) => i.destaque))
      .map((s) => ({
        fullWeek: formatWeek(new Date(s.weekStart)),
        selected: s.items.filter((i) => i.destaque).map((i) => i.nomeEmpreendimento),
      }));
  }, [semanas]);

  // ── Sub-linha de metadados de uma opp ────────────────────────────────────
  const OppMeta = ({ item }: { item: OppItem }) => (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {item.preco && (
        <span className="text-[11px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{item.preco}</span>
      )}
      {item.condicoes && <span className="text-[11px] text-gray-500">{item.condicoes}</span>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Opps da Semana</h1>
        <p className="text-gray-500 text-sm">
          Escolha as opps que vão para publicação e monte os textos de WhatsApp e e-mail.
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1.5 mt-2">
          <Clock className="w-3.5 h-3.5" />
          Você escolhe na sexta — as 5 que sobem esta semana são para publicar na semana seguinte.
        </div>
      </div>

      {/* Links úteis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700">Opps Mônica (Comunidade)</p>
              <p className="text-xs text-gray-500">Preencha as opps para a comunidade</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://opps-seazone.vercel.app/#marketplace" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Abrir
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700">Transformar Opps</p>
              <p className="text-xs text-gray-500">Converte opps para o formato da Mônica</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://claude.ai/artifacts/latest/63177553-77d0-4911-89d2-01a5114de546" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Abrir
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-3.5">
            <p className="text-sm font-medium text-gray-700">Montar Textos 2 Top Opps</p>
            <p className="text-xs text-gray-500 mt-1">
              Claude Cowork → skill <code className="font-mono">/textos-2-top-opps-marketplace</code> → ele pede os dados do empreendimento e monta 2 opções de WhatsApp e 2 de e-mail.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seletor de semana + histórico */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goPrev} disabled={activeWeekIdx === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-gray-800 min-w-[190px] text-center text-sm">
            {activeSemana ? formatWeek(new Date(activeSemana.weekStart)) : "—"}
          </span>
          <Button variant="outline" size="icon" onClick={goNext} disabled={activeWeekIdx >= semanas.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant={showHistory ? "default" : "outline"} size="sm" onClick={() => setShowHistory(!showHistory)}>
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
              Histórico de opps escolhidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma opp escolhida ainda</p>
            ) : (
              <div className="space-y-3">
                {historyData.map((entry, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-sm text-gray-700 mb-1">{entry.fullWeek}</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.selected.map((name, i) => (
                        <span key={i} className="text-sm text-teal-700 bg-white rounded-lg px-2 py-1 border">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── BLOCO 1: Opps desta sexta ─────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Opps desta sexta
                <Badge variant="secondary">{oppsDaSemana.length} do Marketplace</Badge>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Cole as 5 opps e marque as <strong>3 da Mônica</strong> (ela publica na semana seguinte). As <strong>2 que sobrarem</strong> ficam disponíveis para você escolher.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Colar em lote */}
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
            placeholder={`Cole aqui as 5 opps, uma por linha:\nSantinho Spot - 309B: R$ 289.000,00 ; ágio zero; entrada até 3x\nCanasvieiras Spot - 211: R$ 263.871,91; 7% abaixo do mercado`}
            value={bulkOppText}
            onChange={(e) => {
              setBulkOppText(e.target.value);
              setBulkError(null);
              setBulkSuccess(null);
            }}
            rows={4}
            className="text-sm font-mono"
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleAddBulkOpps} disabled={addingOpp || !bulkOppText.trim()}>
              <Plus className="w-4 h-4" />
              {addingOpp ? "Adicionando..." : "Adicionar opps"}
            </Button>
          </div>

          {/* Legenda */}
          {oppsDaSemana.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-violet-300" /> Mônica (posta semana seguinte)</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-gray-300 bg-white" /> Disponível p/ você</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-teal-600" /> Escolhida</span>
            </div>
          )}

          {/* Lista das opps desta semana */}
          <div className="space-y-2 mt-2">
            {oppsDaSemana.map((item) => {
              const isMonica = item.tipoDestaque === "monica";
              const isChosen = item.destaque;
              const isEditing = editingOpp === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    isChosen
                      ? "border-teal-300 bg-teal-50"
                      : isMonica
                      ? "border-violet-200 bg-violet-50/40 opacity-70"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <Input value={editOppData.nome} onChange={(e) => setEditOppData({ ...editOppData, nome: e.target.value })} placeholder="Nome" className="text-sm" />
                      <div className="flex gap-2">
                        <Input value={editOppData.preco} onChange={(e) => setEditOppData({ ...editOppData, preco: e.target.value })} placeholder="Preço" className="text-sm" />
                        <Input value={editOppData.condicoes} onChange={(e) => setEditOppData({ ...editOppData, condicoes: e.target.value })} placeholder="Condições" className="text-sm" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingOpp(null)}>Cancelar</Button>
                        <Button size="sm" onClick={() => handleSaveEditOpp(item)}>Salvar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800">{item.nomeEmpreendimento}</p>
                        <OppMeta item={item} />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isChosen ? (
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => handleRemoveChosen(item)} disabled={busyId === item.id}>
                            <Check className="w-4 h-4" /> Escolhida
                          </Button>
                        ) : isMonica ? (
                          <>
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Mônica
                            </Badge>
                            <Button size="sm" variant="ghost" className="text-gray-400 text-xs" onClick={() => handleToggleMonica(item)} disabled={busyId === item.id}>
                              desfazer
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-violet-600 border-violet-200" onClick={() => handleToggleMonica(item)} disabled={busyId === item.id}>
                              Mônica
                            </Button>
                            {podeEscolherMais && (
                              <Button size="sm" variant="outline" className="text-teal-700 border-teal-300" onClick={() => handleToggleDestaque(item)} disabled={busyId === item.id}>
                                Escolher
                              </Button>
                            )}
                          </>
                        )}
                        {!isChosen && (
                          <>
                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-blue-600 h-8 w-8" onClick={() => handleStartEditOpp(item)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600 h-8 w-8" onClick={() => handleDeleteOpp(item)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {oppsDaSemana.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Cole acima as 5 opps recebidas do Marketplace.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 2: Opps da semana passada ───────────────────────────────── */}
      {oppsSemanaPassada.length > 0 && (
        <Card className="mb-4 border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Opps da semana passada
                  <Badge variant="secondary">{formatWeek(new Date(prevSemana!.weekStart))}</Badge>
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">Você também pode escolher entre estas para publicar nesta semana.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {oppsSemanaPassada.map((item) => {
                const jaTrazida = nomesTrazidos.has(item.nomeEmpreendimento);
                return (
                  <div key={item.id} className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${jaTrazida ? "border-teal-300 bg-teal-50" : "border-gray-200 bg-white"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.nomeEmpreendimento}</p>
                      <OppMeta item={item} />
                    </div>
                    {jaTrazida ? (
                      <Badge className="bg-teal-600 text-white flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> Escolhida
                      </Badge>
                    ) : (
                      podeEscolherMais && (
                        <Button size="sm" variant="outline" className="text-teal-700 border-teal-300 shrink-0" onClick={() => handleChoosePrev(item)} disabled={busyId === item.id}>
                          Escolher
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── BLOCO 3: Escolhidas para publicar ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Escolhidas para publicar esta semana
                <Badge variant={escolhidas.length === 2 ? "success" : "secondary"}>{escolhidas.length}/2</Badge>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Publicadas em social a semana toda + WhatsApp e e-mail. Cole um link com o conteúdo ou digite direto — tudo é salvo.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {escolhidas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhuma escolhida ainda. Use "Escolher" nas opps acima (desta semana ou da semana passada).
            </p>
          ) : (
            <div className="space-y-4">
              {escolhidas.map((item) => {
                const daSemanaPassada = item.tipoDestaque === "semana-anterior";
                return (
                  <div key={item.id} className="rounded-xl border border-teal-200 border-l-4 border-l-teal-600 p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{item.nomeEmpreendimento}</p>
                        <span className={`inline-block mt-1 text-[11px] font-medium rounded-full px-2 py-0.5 border ${daSemanaPassada ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>
                          {daSemanaPassada ? "da semana passada" : "desta semana"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => handleRemoveChosen(item)} disabled={busyId === item.id}>
                        <X className="w-4 h-4" /> Remover
                      </Button>
                    </div>

                    {/* WhatsApp */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-green-700 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> WhatsApp
                        </label>
                        <Button size="sm" variant="outline" onClick={() => handleSaveTexto(item, "textoWhatsapp")} disabled={saving === item.id + "textoWhatsapp"} className="text-green-700 border-green-300">
                          Salvar
                        </Button>
                      </div>
                      <Textarea
                        value={editWhatsapp[item.id] !== undefined ? editWhatsapp[item.id] : item.textoWhatsapp ?? ""}
                        onChange={(e) => handleUpdateTexto(item.id, "textoWhatsapp", e.target.value)}
                        placeholder="Cole um link com o conteúdo ou digite o texto do WhatsApp…"
                        rows={3}
                        className="text-sm bg-white"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-blue-700 flex items-center gap-1">
                          <Mail className="w-4 h-4" /> E-mail
                        </label>
                        <Button size="sm" variant="outline" onClick={() => handleSaveTexto(item, "textoEmail")} disabled={saving === item.id + "textoEmail"} className="text-blue-700 border-blue-300">
                          Salvar
                        </Button>
                      </div>
                      <Textarea
                        value={editEmail[item.id] !== undefined ? editEmail[item.id] : item.textoEmail ?? ""}
                        onChange={(e) => handleUpdateTexto(item.id, "textoEmail", e.target.value)}
                        placeholder="Cole um link com o conteúdo ou digite o texto do e-mail…"
                        rows={3}
                        className="text-sm bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
