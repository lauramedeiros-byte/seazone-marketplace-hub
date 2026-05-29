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
  Check,
  ChevronDown,
  ChevronRight,
  Calendar,
  Building2,
  X,
} from "lucide-react";

interface MidiaPagaVariacao {
  id: string;
  nome: string;
  checked: boolean;
}

interface MidiaPagaEstrutura {
  id: string;
  nome: string;
  checked: boolean;
  variacoes: MidiaPagaVariacao[];
}

interface MidiaPagaFormato {
  id: string;
  nome: string;
  checked: boolean;
  estruturas: MidiaPagaEstrutura[];
}

interface MidiaPagaPrioridade {
  id: string;
  empreendimento: {
    id: string;
    nome: string;
  };
  formatos: MidiaPagaFormato[];
}

interface MidiaPagaMes {
  id: string;
  mes: string;
  estrategia: string | null;
  campanhasAtivas: string | null;
  briefingsZerados: string | null;
  priorities: MidiaPagaPrioridade[];
}

interface Empreendimento {
  id: string;
  nome: string;
}

interface Props {
  meses: MidiaPagaMes[];
  empreendimentos: Empreendimento[];
}

export function PrioridadesMidiaPagaClient({ meses: initialMeses, empreendimentos: initialEmpreendimentos }: Props) {
  const [meses, setMeses] = useState(initialMeses);
  const [empreendimentos, setEmpreendimentos] = useState(initialEmpreendimentos);
  const [activeMesIdx, setActiveMesIdx] = useState(0);
  const [showAddMes, setShowAddMes] = useState(false);
  const [newMesValue, setNewMesValue] = useState("");
  const [showAddEmpreendimento, setShowAddEmpreendimento] = useState(false);
  const [newEmpreendimentoName, setNewEmpreendimentoName] = useState("");
  const [editingEmpreendimentoId, setEditingEmpreendimentoId] = useState<string | null>(null);
  const [editingEmpreendimentoName, setEditingEmpreendimentoName] = useState("");
  const [formatosAbertos, setFormatosAbertos] = useState<Record<string, boolean>>({});
  const [editingMes, setEditingMes] = useState<{ estrategia?: string; campanhasAtivas?: string; briefingsZerados?: string }>({});

  const activeMes = meses[activeMesIdx];

  const formatMes = (mes: string) => {
    const [year, month] = mes.split("-");
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const toggleFormato = async (id: string, checked: boolean) => {
    await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-formato", id, checked }),
    });
    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return {
        ...m,
        priorities: m.priorities.map(p => ({
          ...p,
          formatos: p.formatos.map(f => f.id === id ? { ...f, checked } : f),
        })),
      };
    }));
  };

  const toggleEstrutura = async (id: string, checked: boolean) => {
    await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-estrutura", id, checked }),
    });
    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return {
        ...m,
        priorities: m.priorities.map(p => ({
          ...p,
          formatos: p.formatos.map(f => ({
            ...f,
            estruturas: f.estruturas.map(e => e.id === id ? { ...e, checked } : e),
          })),
        })),
      };
    }));
  };

  const toggleVariacao = async (id: string, checked: boolean) => {
    await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-variacao", id, checked }),
    });
    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return {
        ...m,
        priorities: m.priorities.map(p => ({
          ...p,
          formatos: p.formatos.map(f => ({
            ...f,
            estruturas: f.estruturas.map(e => ({
              ...e,
              variacoes: e.variacoes.map(v => v.id === id ? { ...v, checked } : v),
            })),
          })),
        })),
      };
    }));
  };

  const handleCreateMes = async () => {
    if (!newMesValue) return;
    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-mes", mes: newMesValue }),
    });
    const data = await result.json();
    if (result.ok) {
      setMeses(prev => [{ ...data, priorities: [] }, ...prev]);
      setActiveMesIdx(0);
      setNewMesValue("");
      setShowAddMes(false);
    }
  };

  const handleDeleteMes = async (id: string) => {
    if (!confirm("Excluir este mês? Todas as prioridades serão excluídas.")) return;
    await fetch(`/api/prioridades-midia-paga?id=${id}&type=mes`, { method: "DELETE" });
    setMeses(prev => prev.filter(m => m.id !== id));
    if (activeMesIdx >= meses.length - 1) {
      setActiveMesIdx(Math.max(0, activeMesIdx - 1));
    }
  };

  const handleAddEmpreendimento = async () => {
    if (!newEmpreendimentoName.trim()) return;
    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-empreendimento", nome: newEmpreendimentoName.trim() }),
    });
    const data = await result.json();
    if (result.ok) {
      setEmpreendimentos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNewEmpreendimentoName("");
      setShowAddEmpreendimento(false);
    }
  };

  const handleStartEditEmpreendimento = (emp: { id: string; nome: string }) => {
    setEditingEmpreendimentoId(emp.id);
    setEditingEmpreendimentoName(emp.nome);
  };

  const handleSaveEditEmpreendimento = async () => {
    if (!editingEmpreendimentoId || !editingEmpreendimentoName.trim()) return;
    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-empreendimento", id: editingEmpreendimentoId, nome: editingEmpreendimentoName.trim() }),
    });
    if (result.ok) {
      setEmpreendimentos(prev => prev.map(e => e.id === editingEmpreendimentoId ? { ...e, nome: editingEmpreendimentoName.trim() } : e));
      setEditingEmpreendimentoId(null);
      setEditingEmpreendimentoName("");
    }
  };

  const handleDeleteEmpreendimento = async (id: string) => {
    if (!confirm("Excluir este empreendimento? Ele será removido de todos os meses.")) return;
    await fetch(`/api/prioridades-midia-paga?id=${id}&type=empreendimento`, { method: "DELETE" });
    setEmpreendimentos(prev => prev.filter(e => e.id !== id));
  };

  const handleAddPrioridade = async (empreendimentoId: string) => {
    if (!activeMes) return;
    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-prioridade",
        mesId: activeMes.id,
        empreendimentoId,
      }),
    });
    const data = await result.json();
    if (result.ok) {
      setMeses(prev => prev.map((m, mi) => {
        if (mi !== activeMesIdx) return m;
        const emp = empreendimentos.find(e => e.id === empreendimentoId);
        return {
          ...m,
          priorities: [...m.priorities, {
            ...data,
            empreendimento: emp,
            formatos: [],
          }],
        };
      }));
    }
  };

  const handleRemovePrioridade = async (prioridadeId: string) => {
    if (!confirm("Remover este empreendimento do mês?")) return;
    await fetch(`/api/prioridades-midia-paga?id=${prioridadeId}&type=prioridade`, { method: "DELETE" });
    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return { ...m, priorities: m.priorities.filter(p => p.id !== prioridadeId) };
    }));
  };

  const handleSaveMesText = async (field: "estrategia" | "campanhasAtivas" | "briefingsZerados") => {
    if (!activeMes) return;
    const value = editingMes[field];
    if (value === undefined) return;

    await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-mes",
        id: activeMes.id,
        [field]: value,
      }),
    });

    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return { ...m, [field]: value };
    }));
  };

  const handleAddEstrutura = async (formatoId: string) => {
    const existingNames = activeMes?.priorities
      .flatMap(p => p.formatos)
      .flatMap(f => f.estruturas)
      .map(e => e.nome) || [];
    const nextNum = existingNames.filter(n => n.startsWith("E")).length + 1;
    const newName = `E${nextNum}`;

    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-estrutura", formatoId, nome: newName }),
    });
    const data = await result.json();
    if (result.ok) {
      setMeses(prev => prev.map((m, mi) => {
        if (mi !== activeMesIdx) return m;
        return {
          ...m,
          priorities: m.priorities.map(p => ({
            ...p,
            formatos: p.formatos.map(f =>
              f.id === formatoId
                ? { ...f, estruturas: [...f.estruturas, { ...data, variacoes: data.variacoes || [] }] }
                : f
            ),
          })),
        };
      }));
    }
  };

  const handleRemoveEstrutura = async (id: string) => {
    if (!confirm("Remover esta estrutura e todas as suas variações?")) return;
    await fetch(`/api/prioridades-midia-paga?id=${id}&type=estrutura`, { method: "DELETE" });
    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return {
        ...m,
        priorities: m.priorities.map(p => ({
          ...p,
          formatos: p.formatos.map(f => ({
            ...f,
            estruturas: f.estruturas.filter(e => e.id !== id),
          })),
        })),
      };
    }));
  };

  const handleAddVariacao = async (estruturaId: string) => {
    const existingNames = activeMes?.priorities
      .flatMap(p => p.formatos)
      .flatMap(f => f.estruturas)
      .flatMap(e => e.variacoes)
      .map(v => v.nome) || [];
    const nextNum = existingNames.filter(n => n.startsWith("V")).length + 1;
    const newName = `V${nextNum}`;

    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-variacao", estruturaId, nome: newName }),
    });
    const data = await result.json();
    if (result.ok) {
      setMeses(prev => prev.map((m, mi) => {
        if (mi !== activeMesIdx) return m;
        return {
          ...m,
          priorities: m.priorities.map(p => ({
            ...p,
            formatos: p.formatos.map(f => ({
              ...f,
              estruturas: f.estruturas.map(e =>
                e.id === estruturaId
                  ? { ...e, variacoes: [...e.variacoes, data] }
                  : e
              ),
            })),
          })),
        };
      }));
    }
  };

  const handleRemoveVariacao = async (id: string) => {
    await fetch(`/api/prioridades-midia-paga?id=${id}&type=variacao`, { method: "DELETE" });
    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return {
        ...m,
        priorities: m.priorities.map(p => ({
          ...p,
          formatos: p.formatos.map(f => ({
            ...f,
            estruturas: f.estruturas.map(e => ({
              ...e,
              variacoes: e.variacoes.filter(v => v.id !== id),
            })),
          })),
        })),
      };
    }));
  };

  const prioridadesIds = activeMes?.priorities.map(p => p.empreendimento.id) || [];
  const availableEmpreendimentos = empreendimentos.filter(e => !prioridadesIds.includes(e.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Prioridades de Mídia Paga
        </h1>
        <p className="text-gray-500">
          Planejamento mensal de prioridades e formatos de criativos
        </p>
      </div>

      {/* Seletor de mês */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {meses.map((mes, idx) => (
            <button
              key={mes.id}
              onClick={() => setActiveMesIdx(idx)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                idx === activeMesIdx
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {formatMes(mes.mes)}
            </button>
          ))}
        </div>

        {showAddMes ? (
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={newMesValue}
              onChange={(e) => setNewMesValue(e.target.value)}
              className="w-40"
            />
            <Button size="sm" onClick={handleCreateMes}>Criar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddMes(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowAddMes(true)}>
            <Plus className="w-4 h-4" />
            Novo mês
          </Button>
        )}

        {activeMes && (
          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteMes(activeMes.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!activeMes ? (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum mês criado ainda.</p>
          <Button className="mt-4" onClick={() => setShowAddMes(true)}>
            <Plus className="w-4 h-4" />
            Criar primeiro mês
          </Button>
        </Card>
      ) : (
        <>
          {/* Perguntas do mês */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Planejamento do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Qual a estratégia adotada (gatilho de teste nos criativos):
                </label>
                <Textarea
                  value={editingMes.estrategia ?? activeMes.estrategia ?? ""}
                  onChange={(e) => setEditingMes(prev => ({ ...prev, estrategia: e.target.value }))}
                  onBlur={() => handleSaveMesText("estrategia")}
                  placeholder="Descreva a estratégia do mês..."
                  rows={2}
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Algum desses já está com campanha ativa? Se sim, quais:
                </label>
                <Textarea
                  value={editingMes.campanhasAtivas ?? activeMes.campanhasAtivas ?? ""}
                  onChange={(e) => setEditingMes(prev => ({ ...prev, campanhasAtivas: e.target.value }))}
                  onBlur={() => handleSaveMesText("campanhasAtivas")}
                  placeholder="Liste as campanhas ativas..."
                  rows={2}
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Quais você precisa fazer briefing do zero (ainda não tem campanha ativa):
                </label>
                <Textarea
                  value={editingMes.briefingsZerados ?? activeMes.briefingsZerados ?? ""}
                  onChange={(e) => setEditingMes(prev => ({ ...prev, briefingsZerados: e.target.value }))}
                  onBlur={() => handleSaveMesText("briefingsZerados")}
                  placeholder="Liste os empreendimentos que precisam de briefing..."
                  rows={2}
                  className="text-sm bg-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Empreendimentos Prioritários */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Lista de Empreendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Lista de todos os empreendimentos com edit/delete */}
              <div className="space-y-2 mb-4">
                {empreendimentos.map(emp => {
                  const isInMes = prioridadesIds.includes(emp.id);
                  const isEditing = editingEmpreendimentoId === emp.id;
                  return (
                    <div key={emp.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {isEditing ? (
                        <>
                          <Input
                            value={editingEmpreendimentoName}
                            onChange={(e) => setEditingEmpreendimentoName(e.target.value)}
                            className="flex-1 h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveEditEmpreendimento} className="h-8">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingEmpreendimentoId(null)} className="h-8 w-8 p-0">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium">{emp.nome}</span>
                          {!isInMes && (
                            <>
                              <button
                                onClick={() => handleStartEditEmpreendimento(emp)}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteEmpreendimento(emp.id)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Excluir"
                              >
                                🗑️
                              </button>
                              <Button size="sm" variant="outline" onClick={() => handleAddPrioridade(emp.id)} className="h-7 text-xs">
                                <Plus className="w-3 h-3" />
                                Adicionar ao mês
                              </Button>
                            </>
                          )}
                          {isInMes && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              ✓ No mês
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Adicionar novo */}
              {showAddEmpreendimento ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do novo empreendimento"
                    value={newEmpreendimentoName}
                    onChange={(e) => setNewEmpreendimentoName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddEmpreendimento}>Adicionar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddEmpreendimento(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowAddEmpreendimento(true)}>
                  <Plus className="w-4 h-4" />
                  Adicionar novo empreendimento
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lista de empreendimentos com formatos */}
          {activeMes.priorities.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum empreendimento adicionado neste mês ainda.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeMes.priorities.map((prioridade) => {
                const hasFormatos = prioridade.formatos.length > 0;
                const checkedCount = prioridade.formatos.filter(f => f.checked).length;
                const totalCount = prioridade.formatos.length;

                return (
                  <Card key={prioridade.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{prioridade.empreendimento.nome}</CardTitle>
                        <div className="flex items-center gap-2">
                          {hasFormatos && (
                            <Badge variant={checkedCount === totalCount ? "success" : "secondary"}>
                              {checkedCount}/{totalCount}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 h-8 w-8 p-0"
                            onClick={() => handleRemovePrioridade(prioridade.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Formatos */}
                      {hasFormatos ? (
                        <div className="space-y-2">
                          {prioridade.formatos.map((formato) => {
                            const isOpen = formatosAbertos[formato.id];
                            const checkedEstruturas = formato.estruturas.filter(e => e.checked).length;
                            return (
                              <div key={formato.id} className="border rounded-lg overflow-hidden">
                                <div
                                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => setFormatosAbertos(prev => ({ ...prev, [formato.id]: !prev[formato.id] }))}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={formato.checked}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleFormato(formato.id, !formato.checked);
                                      }}
                                      className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="font-medium text-sm">{formato.nome}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {checkedEstruturas}/{formato.estruturas.length}
                                    </Badge>
                                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </div>
                                </div>

                                {isOpen && (
                                  <div className="p-3 border-t bg-white">
                                    <div className="flex flex-wrap gap-2">
                                      {formato.estruturas.map((estrutura) => (
                                        <div key={estrutura.id} className="border rounded-md p-2 bg-gray-50 min-w-[100px]">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={estrutura.checked}
                                                onChange={() => toggleEstrutura(estrutura.id, !estrutura.checked)}
                                                className="w-3 h-3"
                                              />
                                              <span className="font-medium text-sm">{estrutura.nome}</span>
                                            </div>
                                            <button
                                              onClick={() => handleRemoveEstrutura(estrutura.id)}
                                              className="text-gray-400 hover:text-red-500"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {estrutura.variacoes.map((variacao) => (
                                              <div
                                                key={variacao.id}
                                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer ${
                                                  variacao.checked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                                }`}
                                                onClick={() => toggleVariacao(variacao.id, !variacao.checked)}
                                              >
                                                {variacao.checked && <Check className="w-2 h-2" />}
                                                <span>{variacao.nome}</span>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveVariacao(variacao.id);
                                                  }}
                                                  className="text-gray-400 hover:text-red-500"
                                                >
                                                  <X className="w-2 h-2" />
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => handleAddVariacao(estrutura.id)}
                                              className="px-2 py-0.5 rounded text-xs text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300"
                                            >
                                              <Plus className="w-3 h-3 inline" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => handleAddEstrutura(formato.id)}
                                        className="px-3 py-2 rounded border border-dashed border-gray-300 text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300"
                                      >
                                        <Plus className="w-4 h-4 inline mr-1" />
                                        E
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">
                          Sem formatos ainda
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}