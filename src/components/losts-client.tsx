"use client";

import { useState } from "react";
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
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Ban,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import {
  createLostGrupo,
  deleteLostGrupo,
  createLostDisparo,
  updateLostDisparo,
  addLostHistorico,
} from "@/lib/actions";

interface LostHistorico {
  id: string;
  tipoEvento: string;
  comentario: string | null;
  dataEvento: Date;
}

interface LostDisparo {
  id: string;
  dataDisparo: Date | null;
  dataRangeInicio: Date | null;
  dataRangeFim: Date | null;
  etapaFiltro: string | null;
  textoEmail: string | null;
  textoWhatsapp: string | null;
  statusDisparo: string;
  Disparado: boolean;
  comentarioDisparo: string | null;
  historico: LostHistorico[];
}

interface LostGrupo {
  id: string;
  nomeMotivo: string;
  Disparos: LostDisparo[];
}

interface Props {
  grupos: LostGrupo[];
}

const statusColor: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-600",
  pronto: "bg-blue-100 text-blue-700",
  disparado: "bg-green-100 text-green-700",
  barrado: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  pronto: "Pronto para disparo",
  disparado: "Disparado",
  barrado: "Barrado",
};

export function LostsClient({ grupos: initial }: Props) {
  const { user } = useUser();
  const [grupos, setGrupos] = useState(initial);
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, string | null>>(
    () => ({})
  );
  const [newGrupoNome, setNewGrupoNome] = useState("");
  const [addingGrupo, setAddingGrupo] = useState(false);
  const [addingDisparo, setAddingDisparo] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, Record<string, string>>>({});
  const [editTextos, setEditTextos] = useState<Record<string, { email?: string; whatsapp?: string }>>(
    {}
  );
  const [comentarioModal, setComentarioModal] = useState<{
    tipo: "disparado" | "barrado";
  } | null>(null);

  const toggleGrupo = (id: string) => {
    setExpandedGrupos((prev) => ({
      ...prev,
      [id]: prev[id] === id ? null : `d-${id}`,
    }));
  };

  const handleCreateGrupo = async () => {
    if (!newGrupoNome.trim()) return;
    setAddingGrupo(true);
    try {
      const grupo = await createLostGrupo(newGrupoNome.trim(), user?.id);
      setGrupos((prev) => [...prev, { ...grupo, Disparos: [] }]);
      setNewGrupoNome("");
    } finally {
      setAddingGrupo(false);
    }
  };

  const handleDeleteGrupo = async (id: string) => {
    if (!confirm("Excluir este grupo e todos os disparos?")) return;
    await deleteLostGrupo(id);
    setGrupos((prev) => prev.filter((g) => g.id !== id));
  };

  const handleCreateDisparo = async (grupoId: string) => {
    setAddingDisparo(grupoId);
    try {
      const disparo = await createLostDisparo(grupoId, { userId: user?.id });
      setGrupos((prev) =>
        prev.map((g) =>
          g.id === grupoId
            ? { ...g, Disparos: [...g.Disparos, { ...disparo, historico: [] }] }
            : g
        )
      );
      setEditForm((p) => ({ ...p, [disparo.id]: {} }));
    } finally {
      setAddingDisparo(null);
    }
  };

  const handleUpdateDisparo = async (disparo: LostDisparo, field: string, value: string) => {
    setEditForm((p) => ({
      ...p,
      [disparo.id]: { ...(p[disparo.id] || {}), [field]: value },
    }));
  };

  const handleSaveDisparo = async (disparo: LostDisparo) => {
    const form = editForm[disparo.id] || {};
    await updateLostDisparo(disparo.id, {
      dataDisparo: form.dataDisparo ? new Date(form.dataDisparo) : undefined,
      dataRangeInicio: form.dataRangeInicio ? new Date(form.dataRangeInicio) : undefined,
      dataRangeFim: form.dataRangeFim ? new Date(form.dataRangeFim) : undefined,
      etapaFiltro: form.etapaFiltro || undefined,
    });
  };

  const handleSaveTextos = async (
    disparo: LostDisparo,
    tipo: "email" | "whatsapp"
  ) => {
    const textos = editTextos[disparo.id] || {};
    const value = tipo === "email" ? textos.email : textos.whatsapp;
    if (value === undefined) return;
    await updateLostDisparo(disparo.id, {
      [tipo === "email" ? "textoEmail" : "textoWhatsapp"]: value,
    });
  };

  const handleChangeStatus = async (
    disparo: LostDisparo,
    novoStatus: string,
    comentario?: string
  ) => {
    await updateLostDisparo(disparo.id, {
      statusDisparo: novoStatus,
      Disparado: novoStatus === "disparado",
      comentarioDisparo: comentario || undefined,
    });
    if (comentario) {
      await addLostHistorico(
        disparo.id,
        novoStatus,
        comentario,
        user?.id
      );
    }
    setGrupos((prev) =>
      prev.map((g) => ({
        ...g,
        Disparos: g.Disparos.map((d) =>
          d.id === disparo.id
            ? {
                ...d,
                statusDisparo: novoStatus,
                Disparado: novoStatus === "disparado",
                historico: comentario
                  ? [
                      ...d.historico,
                      {
                        id: Math.random().toString(),
                        tipoEvento: novoStatus,
                        comentario,
                        dataEvento: new Date(),
                      },
                    ]
                  : d.historico,
              }
            : d
        ),
      }))
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Losts</h1>
        <p className="text-gray-500">
          Agrupamento de motivos, criação de conteúdo e registro de disparos
        </p>
      </div>

      {/* Adicionar grupo */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-2">
          <Input
            placeholder="Nome do motivo (ex: preço alto, localização)..."
            value={newGrupoNome}
            onChange={(e) => setNewGrupoNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateGrupo()}
            className="flex-1"
          />
          <Button onClick={handleCreateGrupo} disabled={addingGrupo || !newGrupoNome.trim()}>
            <Plus className="w-4 h-4" />
            Novo Grupo
          </Button>
        </CardContent>
      </Card>

      {/* Lista de grupos */}
      {grupos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhum grupo cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const isOpen = !!expandedGrupos[grupo.id];
            return (
              <Card key={grupo.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleGrupo(grupo.id)}
                      className="flex items-center gap-2 hover:text-blue-600 text-left"
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <CardTitle className="text-base">
                        {grupo.nomeMotivo}
                      </CardTitle>
                      <Badge variant="secondary">
                        {grupo.Disparos.length} disparo(s)
                      </Badge>
                    </button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateDisparo(grupo.id)}
                        disabled={addingDisparo === grupo.id}
                      >
                        <Plus className="w-4 h-4" />
                        Novo Disparo
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGrupo(grupo.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="space-y-4">
                    {grupo.Disparos.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        Nenhum disparo neste grupo.
                      </p>
                    ) : (
                      grupo.Disparos.map((disparo) => {
                        const form = editForm[disparo.id] || {};
                        const textos = editTextos[disparo.id] || {};
                        return (
                          <div
                            key={disparo.id}
                            className="border border-gray-200 rounded-lg p-4 space-y-3"
                          >
                            {/* Status e ações */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={statusColor[disparo.statusDisparo]}>
                                {statusLabel[disparo.statusDisparo]}
                              </Badge>
                              {disparo.Disparado && (
                                <span className="text-xs text-gray-400">
                                  Disparado em{" "}
                                  {disparo.dataDisparo
                                    ? new Date(disparo.dataDisparo).toLocaleDateString("pt-BR")
                                    : "—"}
                                </span>
                              )}
                            </div>

                            {/* Campos do disparo */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Dt. Disparo</label>
                                <Input
                                  type="date"
                                  value={form.dataDisparo ?? ""}
                                  onChange={(e) => handleUpdateDisparo(disparo, "dataDisparo", e.target.value)}
                                  onBlur={() => handleSaveDisparo(disparo)}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">De</label>
                                <Input
                                  type="date"
                                  value={form.dataRangeInicio ?? ""}
                                  onChange={(e) => handleUpdateDisparo(disparo, "dataRangeInicio", e.target.value)}
                                  onBlur={() => handleSaveDisparo(disparo)}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Até</label>
                                <Input
                                  type="date"
                                  value={form.dataRangeFim ?? ""}
                                  onChange={(e) => handleUpdateDisparo(disparo, "dataRangeFim", e.target.value)}
                                  onBlur={() => handleSaveDisparo(disparo)}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Etapa</label>
                                <Input
                                  value={form.etapaFiltro ?? disparo.etapaFiltro ?? ""}
                                  onChange={(e) => handleUpdateDisparo(disparo, "etapaFiltro", e.target.value)}
                                  onBlur={() => handleSaveDisparo(disparo)}
                                  placeholder="lead in, FUP..."
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            {/* Textos */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">
                                  Texto E-mail
                                </label>
                                <Textarea
                                  value={textos.email ?? disparo.textoEmail ?? ""}
                                  onChange={(e) =>
                                    setEditTextos((p) => ({
                                      ...p,
                                      [disparo.id]: {
                                        ...(p[disparo.id] || {}),
                                        email: e.target.value,
                                      },
                                    }))
                                  }
                                  onBlur={() => handleSaveTextos(disparo, "email")}
                                  rows={4}
                                  placeholder="Conteúdo do e-mail..."
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">
                                  Texto WhatsApp
                                </label>
                                <Textarea
                                  value={textos.whatsapp ?? disparo.textoWhatsapp ?? ""}
                                  onChange={(e) =>
                                    setEditTextos((p) => ({
                                      ...p,
                                      [disparo.id]: {
                                        ...(p[disparo.id] || {}),
                                        whatsapp: e.target.value,
                                      },
                                    }))
                                  }
                                  onBlur={() => handleSaveTextos(disparo, "whatsapp")}
                                  rows={4}
                                  placeholder="Conteúdo do WhatsApp..."
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            {/* Ações de status */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                              {disparo.statusDisparo === "rascunho" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleChangeStatus(disparo, "pronto")
                                  }
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Marcar como pronto
                                </Button>
                              )}
                              {disparo.statusDisparo === "pronto" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      setComentarioModal({ tipo: "disparado" })
                                    }
                                  >
                                    <Send className="w-4 h-4" />
                                    Marcar como disparado
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setComentarioModal({ tipo: "barrado" })
                                    }
                                  >
                                    <Ban className="w-4 h-4" />
                                    Marcar como barrado
                                  </Button>
                                </>
                              )}
                              {(disparo.statusDisparo === "disparado" ||
                                disparo.statusDisparo === "barrado") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleChangeStatus(disparo, "pronto")
                                  }
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Retomar / Reprogramar
                                </Button>
                              )}
                            </div>

                            {/* Comentário */}
                            {comentarioModal && (
                              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <p className="text-sm font-medium mb-2">
                                  Adicionar comentário (
                                  {comentarioModal.tipo === "disparado"
                                    ? "disparo"
                                    : "bloqueio"}
                                  )
                                </p>
                                <Textarea
                                  placeholder="Ex: barrado por saúde do número..."
                                  className="text-sm mb-2"
                                  id={`comentario-${disparo.id}`}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const el = document.getElementById(
                                        `comentario-${disparo.id}`
                                      ) as HTMLTextAreaElement;
                                      handleChangeStatus(
                                        disparo,
                                        comentarioModal.tipo === "disparado"
                                          ? "disparado"
                                          : "barrado",
                                        el?.value
                                      );
                                      setComentarioModal(null);
                                    }}
                                  >
                                    Confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setComentarioModal(null)
                                    }
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Histórico */}
                            {disparo.historico.length > 0 && (
                              <div className="noise:border-l-2 border-blue-200 pl-3 space-y-1">
                                <p className="text-xs font-medium text-gray-500">
                                  Histórico
                                </p>
                                {disparo.historico.map((h, idx) => (
                                  <div key={idx} className="text-xs text-gray-600">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    <span className="font-medium">
                                      {statusLabel[h.tipoEvento] ?? h.tipoEvento}
                                    </span>{" "}
                                    em{" "}
                                    {new Date(h.dataEvento).toLocaleDateString(
                                      "pt-BR"
                                    )}
                                    {h.comentario && (
                                      <span className="text-gray-400 ml-1">
                                        — {h.comentario}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
