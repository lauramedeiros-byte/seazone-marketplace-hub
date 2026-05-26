"use client";

import { useState, useCallback } from "react";
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
  ExternalLink,
} from "lucide-react";
import {
  createOppItem,
  updateOppItem,
  deleteOppItem,
  updateOppSemanaObservacoes,
} from "@/lib/actions";

interface OppItem {
  id: string;
  nomeEmpreendimento: string;
  localizacao: string | null;
  preco: string | null;
  condicoes: string | null;
  destaque: boolean;
  tipoDestaque: string | null;
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
  const [addingOpp, setAddingOpp] = useState(false);
  const [newOpp, setNewOpp] = useState({
    nome: "",
    localizacao: "",
    preco: "",
    condicoes: "",
  });
  const [editWhatsapp, setEditWhatsapp] = useState<Record<string, string>>({});
  const [editEmail, setEditEmail] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const activeSemana = semanas[activeWeekIdx];

  const formatWeek = (d: Date) => {
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(start.getDate() + 6);
    const opts = { day: "2-digit", month: "short" } as const;
    return `${start.toLocaleDateString("pt-BR", opts)} – ${end.toLocaleDateString("pt-BR", opts)}`;
  };

  const goPrev = () => setActiveWeekIdx((i) => Math.max(0, i - 1));
  const goNext = () => setActiveWeekIdx((i) => Math.min(semanas.length - 1, i + 1));

  const handleAddOpp = async () => {
    if (!newOpp.nome.trim() || !activeSemana) return;
    setAddingOpp(true);
    try {
      const item = await createOppItem(activeSemana.id, {
        nomeEmpreendimento: newOpp.nome.trim(),
        localizacao: newOpp.localizacao || undefined,
        preco: newOpp.preco || undefined,
        condicoes: newOpp.condicoes || undefined,
        userId: user?.id,
      });
      setSemanas((prev) =>
        prev.map((s, i) =>
          i === activeWeekIdx
            ? { ...s, items: [...s.items, { ...item, Disparado: false, comentarioDisparo: null }] }
            : s
        )
      );
      setNewOpp({ nome: "", localizacao: "", preco: "", condicoes: "" });
    } finally {
      setAddingOpp(false);
    }
  };

  const handleToggleDestaque = async (item: OppItem) => {
    if (!activeSemana) return;
    const newDestaque = !item.destaque;
    await updateOppItem(item.id, { destaque: newDestaque });
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

  const handleSaveTextoAll = async (
    item: OppItem,
    field: "textoWhatsapp" | "textoEmail"
  ) => {
    const value = field === "textoWhatsapp" ? editWhatsapp[item.id] : editEmail[item.id];
    if (value === undefined) return;
    setSaving(item.id);
    try {
      await updateOppItem(item.id, { [field]: value });
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

  const handleToggleDisparado = async (item: OppItem) => {
    await updateOppItem(item.id, {
      Disparado: !item.Disparado,
      dataDisparo: !item.Disparado ? new Date() : undefined});
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      Disparado: !it.Disparado,
                      dataDisparo: !it.Disparado ? new Date() : null,
                    }
                  : it
              ),
            }
          : s
      )
    );
  };

  const handleDeleteOpp = async (item: OppItem) => {
    if (!confirm("Excluir esta oportunidade?")) return;
    await deleteOppItem(item.id);
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx
          ? { ...s, items: s.items.filter((it) => it.id !== item.id) }
          : s
      )
    );
  };

  const destaques = activeSemana?.items.filter((i) => i.destaque) ?? [];
  const naoDestaques = activeSemana?.items.filter((i) => !i.destaque) ?? [];

  const debouncedSave = useCallback(
    (id: string, field: "textoWhatsapp" | "textoEmail", debouncedValue: string) => {
      const timeout = setTimeout(() => {
        handleSaveTextoAll(
          { id } as OppItem,
          field
        );
      }, 800);
      return () => clearTimeout(timeout);
    },
    []
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Opps da Semana
        </h1>
        <p className="text-gray-500">
          Registro semanal das oportunidades em destaque — selecione as 2
          melhores e crie textos
        </p>
      </div>

      {/* Seletor de semana */}
      <div className="flex items-center gap-4 mb-6">
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

      {/* Form adicionar opp */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input
              placeholder="Nome do empreendimento..."
              value={newOpp.nome}
              onChange={(e) => setNewOpp((p) => ({ ...p, nome: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAddOpp()}
            />
            <Input
              placeholder="Localização..."
              value={newOpp.localizacao}
              onChange={(e) => setNewOpp((p) => ({ ...p, localizacao: e.target.value }))}
            />
            <Input
              placeholder="Preço (ex: R$ 500k)..."
              value={newOpp.preco}
              onChange={(e) => setNewOpp((p) => ({ ...p, preco: e.target.value }))}
            />
            <Input
              placeholder="Condições..."
              value={newOpp.condicoes}
              onChange={(e) => setNewOpp((p) => ({ ...p, condicoes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddOpp} disabled={addingOpp || !newOpp.nome.trim()}>
              <Plus className="w-4 h-4" />
              Adicionar Opp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Em destaque */}
      {destaques.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Em Destaque ({destaques.length})
          </h2>
          <div className="space-y-3">
            {destaques.map((item) => (
              <Card key={item.id} className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.nomeEmpreendimento}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.localizacao && (
                          <Badge variant="secondary">{item.localizacao}</Badge>
                        )}
                        {item.preco && (
                          <Badge variant="secondary">{item.preco}</Badge>
                        )}
                        {item.condicoes && (
                          <Badge variant="outline">{item.condicoes}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={item.Disparado ? "success" : "warning"}>
                        {item.Disparado ? "Disparado" : "Pendente"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDisparado(item)}
                        className="text-xs"
                      >
                        {item.Disparado ? "Marcar pendente" : "Marcar disparado"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* WhatsApp */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <label className="text-sm font-medium text-gray-700">Texto WhatsApp</label>
                    </div>
                    <Textarea
                      value={
                        editWhatsapp[item.id] !== undefined
                          ? editWhatsapp[item.id]
                          : item.textoWhatsapp ?? ""
                      }
                      onChange={(e) => handleUpdateTexto(item.id, "textoWhatsapp", e.target.value)}
                      rows={3}
                      placeholder="Texto para WhatsApp..."
                      className="text-sm"
                    />
                    <div className="flex justify-end mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveTextoAll(item, "textoWhatsapp")}
                        disabled={saving === item.id}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  {/* E-mail */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-medium text-gray-700">Texto E-mail</label>
                    </div>
                    <Textarea
                      value={
                        editEmail[item.id] !== undefined
                          ? editEmail[item.id]
                          : item.textoEmail ?? ""
                      }
                      onChange={(e) => handleUpdateTexto(item.id, "textoEmail", e.target.value)}
                      rows={3}
                      placeholder="Texto para e-mail..."
                      className="text-sm"
                    />
                    <div className="flex justify-end mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveTextoAll(item, "textoEmail")}
                        disabled={saving === item.id}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  {/* Remover destaque */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleDestaque(item)}
                    >
                      <StarOff className="w-4 h-4" />
                      Remover destaque
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Demais opps */}
      {naoDestaques.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Demais Oportunidades
          </h2>
          <div className="space-y-2">
            {naoDestaques.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.nomeEmpreendimento}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.localizacao && (
                        <span className="text-xs text-gray-500">{item.localizacao}</span>
                      )}
                      {item.preco && (
                        <span className="text-xs text-gray-500">{item.preco}</span>
                      )}
                      {item.condicoes && (
                        <span className="text-xs text-gray-500">{item.condicoes}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleDestaque(item)}
                    >
                      <Star className="w-4 h-4" />
                      Destacar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteOpp(item)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeSemana?.items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma oportunidade cadastrada esta semana.</p>
        </div>
      )}
    </div>
  );
}
