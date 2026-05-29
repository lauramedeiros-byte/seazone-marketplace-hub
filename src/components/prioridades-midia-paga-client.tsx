"use client";

import { useState, useEffect } from "react";
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
  ChevronUp,
  Filter,
  Target,
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
  const [formatosAbertos, setFormatosAbertos] = useState<Record<string, boolean>>({});
  const [editingMes, setEditingMes] = useState<{ estrategia?: string; campanhasAtivas?: string; briefingsZerados?: string }>({
    estrategia: initialMeses[0]?.estrategia || "",
    campanhasAtivas: initialMeses[0]?.campanhasAtivas || "",
    briefingsZerados: initialMeses[0]?.briefingsZerados || "",
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchEmpreendimento, setSearchEmpreendimento] = useState("");
  const [collapsedEmpreendimentos, setCollapsedEmpreendimentos] = useState<Record<string, boolean>>({});
  const [showPlanejamento, setShowPlanejamento] = useState(false);

  const activeMes = meses[activeMesIdx];

  // Sincroniza editingMes quando muda de mês
  useEffect(() => {
    if (activeMes) {
      setEditingMes({
        estrategia: activeMes.estrategia || "",
        campanhasAtivas: activeMes.campanhasAtivas || "",
        briefingsZerados: activeMes.briefingsZerados || "",
      });
    }
  }, [activeMes]);

  const formatMes = (mes: string) => {
    const [year, month] = mes.split("-");
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // Calcula progresso do mês
  const calcularProgresso = (prioridades: MidiaPagaPrioridade[]) => {
    if (prioridades.length === 0) return { total: 0, checked: 0, pct: 0 };
    let total = 0;
    let checked = 0;
    prioridades.forEach(p => {
      p.formatos.forEach(f => {
        total++;
        if (f.checked) checked++;
      });
    });
    return { total, checked, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
  };

  const progresso = activeMes ? calcularProgresso(activeMes.priorities) : { total: 0, checked: 0, pct: 0 };

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
    if (!confirm("Excluir este mês?")) return;
    await fetch(`/api/prioridades-midia-paga?id=${id}&type=mes`, { method: "DELETE" });
    setMeses(prev => prev.filter(m => m.id !== id));
    if (activeMesIdx >= meses.length - 1) {
      setActiveMesIdx(Math.max(0, activeMesIdx - 1));
    }
  };

  const handleAddEmpreendimentoToList = async () => {
    if (!newEmpreendimentoName.trim()) return;
    const nomeComSpot = newEmpreendimentoName.trim().toUpperCase().endsWith("SPOT")
      ? newEmpreendimentoName.trim()
      : `${newEmpreendimentoName.trim()} SPOT`;
    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-empreendimento", nome: nomeComSpot }),
    });
    const data = await result.json();
    if (result.ok) {
      setEmpreendimentos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNewEmpreendimentoName("");
      setShowAddEmpreendimento(false);
    }
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
    if (result.ok && data) {
      setMeses(prev => prev.map((m, mi) => {
        if (mi !== activeMesIdx) return m;
        return {
          ...m,
          priorities: [...m.priorities, data],
        };
      }));
      setShowDropdown(false);
      setSearchEmpreendimento("");
      // Expande automaticamente
      setTimeout(() => {
        setCollapsedEmpreendimentos(prev => ({ ...prev, [data.id]: false }));
        if (data.formatos && data.formatos.length > 0) {
          const newState: Record<string, boolean> = {};
          data.formatos.forEach((f: { id: string }) => { newState[f.id] = true; });
          setFormatosAbertos(newState);
        }
      }, 100);
    }
  };

  const handleRemovePrioridade = async (prioridadeId: string) => {
    if (!confirm("Remover?")) return;
    await fetch(`/api/prioridades-midia-paga?id=${prioridadeId}&type=prioridade`, { method: "DELETE" });
    setMeses(prev => prev.map((m, mi) => {
      if (mi !== activeMesIdx) return m;
      return { ...m, priorities: m.priorities.filter(p => p.id !== prioridadeId) };
    }));
  };

  const handleSaveAllMesTexts = async () => {
    if (!activeMes) return;
    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-mes",
        id: activeMes.id,
        estrategia: editingMes.estrategia ?? "",
        campanhasAtivas: editingMes.campanhasAtivas ?? "",
        briefingsZerados: editingMes.briefingsZerados ?? "",
      }),
    });
    if (result.ok) {
      const data = await result.json();
      setMeses(prev => prev.map((m, mi) => {
        if (mi !== activeMesIdx) return m;
        return { ...m, ...data };
      }));
    }
  };

  const handleAddEstrutura = async (formatoId: string) => {
    const formato = activeMes?.priorities.flatMap(p => p.formatos).find(f => f.id === formatoId);
    const nextNum = formato ? formato.estruturas.length + 1 : 1;
    const newName = `E${nextNum}`;

    const result = await fetch("/api/prioridades-midia-paga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-estrutura", formatoId, nome: newName }),
    });
    const data = await result.json();
    if (result.ok && data) {
      setMeses(prev => prev.map((m, mi) => {
        if (mi !== activeMesIdx) return m;
        return {
          ...m,
          priorities: m.priorities.map(p => ({
            ...p,
            formatos: p.formatos.map(f => {
              if (f.id !== formatoId) return f;
              const novasVariacoes = data.variacoes || Array.from({ length: 5 }, (_, i) => ({
                id: `temp-${Date.now()}-${i}`,
                nome: `V${i + 1}`,
                checked: false,
              }));
              return { ...f, estruturas: [...f.estruturas, { ...data, variacoes: novasVariacoes }] };
            }),
          })),
        };
      }));
    }
  };

  const handleRemoveEstrutura = async (id: string) => {
    if (!confirm("Remover estrutura?")) return;
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
    const estrutura = activeMes?.priorities.flatMap(p => p.formatos).flatMap(f => f.estruturas).find(e => e.id === estruturaId);
    const nextNum = estrutura ? estrutura.variacoes.length + 1 : 1;
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
                e.id === estruturaId ? { ...e, variacoes: [...e.variacoes, data] } : e
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

  const toggleEmpreendimento = (id: string) => {
    setCollapsedEmpreendimentos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllEmpreendimentos = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    activeMes?.priorities.forEach(p => { newState[p.id] = expand; });
    setCollapsedEmpreendimentos(newState);
  };

  const prioridadesIds = activeMes?.priorities.map(p => p.empreendimento.id) || [];
  const filteredEmpreendimentos = empreendimentos.filter(emp =>
    !prioridadesIds.includes(emp.id) &&
    emp.nome.toLowerCase().includes(searchEmpreendimento.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Prioridades de Mídia Paga</h1>
      </div>

      {/* Seletor de mês + progresso */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {meses.map((mes, idx) => (
            <button
              key={mes.id}
              onClick={() => setActiveMesIdx(idx)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                idx === activeMesIdx ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {formatMes(mes.mes)}
            </button>
          ))}
        </div>

        {showAddMes ? (
          <div className="flex items-center gap-2">
            <Input type="month" value={newMesValue} onChange={(e) => setNewMesValue(e.target.value)} className="w-36" />
            <Button size="sm" onClick={handleCreateMes}>Criar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddMes(false)}><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowAddMes(true)}>
            <Plus className="w-4 h-4" /> Mês
          </Button>
        )}

        {activeMes && (
          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteMes(activeMes.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {activeMes && activeMes.priorities.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => toggleAllEmpreendimentos(true)} className="text-green-600">
            <Check className="w-4 h-4" /> Expandir
          </Button>
        )}
      </div>

      {!activeMes ? (
        <Card className="p-8 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum mês criado.</p>
          <Button className="mt-3" onClick={() => setShowAddMes(true)}>
            <Plus className="w-4 h-4" /> Criar mês
          </Button>
        </Card>
      ) : (
        <>
          {/* Barra de resumo */}
          <div className="flex items-center justify-between mb-4 bg-white rounded-lg border p-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{activeMes.priorities.length} empreendimentos</span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{progresso.checked}/{progresso.total} formatos</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progresso.pct}%` }} />
                </div>
                <span className="text-sm font-medium text-blue-600">{progresso.pct}%</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowPlanejamento(!showPlanejamento)}>
                {showPlanejamento ? <ChevronUp className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                Planejamento
              </Button>
            </div>
          </div>

          {/* Card de planejamento (colapsável) */}
          {showPlanejamento && (
            <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Planejamento do Mês
                  </CardTitle>
                  <Button size="sm" onClick={handleSaveAllMesTexts}>
                    <Check className="w-4 h-4" /> Salvar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Estratégia (gatilho de teste):</label>
                  <Textarea
                    value={editingMes.estrategia ?? ""}
                    onChange={(e) => setEditingMes(prev => ({ ...prev, estrategia: e.target.value }))}
                    placeholder="..."
                    rows={2}
                    className="text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Campanhas ativas:</label>
                  <Textarea
                    value={editingMes.campanhasAtivas ?? ""}
                    onChange={(e) => setEditingMes(prev => ({ ...prev, campanhasAtivas: e.target.value }))}
                    placeholder="..."
                    rows={1}
                    className="text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Briefings do zero:</label>
                  <Textarea
                    value={editingMes.briefingsZerados ?? ""}
                    onChange={(e) => setEditingMes(prev => ({ ...prev, briefingsZerados: e.target.value }))}
                    placeholder="..."
                    rows={1}
                    className="text-sm bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seletor de empreendimento */}
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 text-left"
                >
                  <span className="text-gray-500 text-sm">Adicionar empreendimento...</span>
                  {showDropdown ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar..."
                        value={searchEmpreendimento}
                        onChange={(e) => setSearchEmpreendimento(e.target.value)}
                        className="text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredEmpreendimentos.length === 0 ? (
                        <p className="p-3 text-sm text-gray-500 text-center">Nenhum encontrado</p>
                      ) : (
                        filteredEmpreendimentos.map(emp => (
                          <button
                            key={emp.id}
                            onClick={() => handleAddPrioridade(emp.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                          >
                            {emp.nome}
                          </button>
                        ))
                      )}
                    </div>
                    {showAddEmpreendimento ? (
                      <div className="p-2 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Novo empreendimento"
                            value={newEmpreendimentoName}
                            onChange={(e) => setNewEmpreendimentoName(e.target.value)}
                            className="text-sm flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleAddEmpreendimentoToList}>+</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddEmpreendimento(true)}
                        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 border-t flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Novo
                      </button>
                    )}
                  </div>
                )}
              </div>
              {showDropdown && (
                <div className="fixed inset-0 z-0" onClick={() => { setShowDropdown(false); setSearchEmpreendimento(""); }} />
              )}
            </CardContent>
          </Card>

          {/* Lista de empreendimentos */}
          {activeMes.priorities.length === 0 ? (
            <Card className="p-6 text-center">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhum empreendimento adicionado.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeMes.priorities.map((prioridade, idx) => {
                const isCollapsed = collapsedEmpreendimentos[prioridade.id] !== false;
                const hasFormatos = prioridade.formatos.length > 0;
                const checkedCount = prioridade.formatos.filter(f => f.checked).length;
                const totalCount = prioridade.formatos.length;

                return (
                  <Card key={prioridade.id} className="overflow-hidden">
                    {/* Header do empreendimento (sempre visível) */}
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleEmpreendimento(prioridade.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-sm">{prioridade.empreendimento.nome}</span>
                        {hasFormatos && (
                          <Badge variant={checkedCount === totalCount ? "success" : "secondary"} className="text-xs">
                            {checkedCount}/{totalCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); handleRemovePrioridade(prioridade.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Conteúdo expandido */}
                    {!isCollapsed && (
                      <CardContent className="p-3 border-t">
                        <div className="space-y-2">
                          {prioridade.formatos.map((formato) => {
                            const isOpen = formatosAbertos[formato.id];
                            const checkedEstruturas = formato.estruturas.filter(e => e.checked).length;
                            return (
                              <div key={formato.id} className="border rounded-lg overflow-hidden">
                                <div
                                  className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                  onClick={() => setFormatosAbertos(prev => ({ ...prev, [formato.id]: !prev[formato.id] }))}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={formato.checked}
                                      onChange={(e) => { e.stopPropagation(); toggleFormato(formato.id, !formato.checked); }}
                                      className="w-4 h-4"
                                    />
                                    <span className="font-medium text-xs">{formato.nome}</span>
                                    <Badge variant="outline" className="text-xs">{checkedEstruturas}/{formato.estruturas.length}</Badge>
                                  </div>
                                  {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </div>

                                {isOpen && (
                                  <div className="p-2 border-t bg-white">
                                    <div className="flex flex-wrap gap-2">
                                      {formato.estruturas.map((estrutura) => (
                                        <div key={estrutura.id} className="border rounded p-1.5 bg-gray-50 min-w-[90px]">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="checkbox"
                                                checked={estrutura.checked}
                                                onChange={() => toggleEstrutura(estrutura.id, !estrutura.checked)}
                                                className="w-3 h-3"
                                              />
                                              <span className="font-medium text-xs">{estrutura.nome}</span>
                                            </div>
                                            <button onClick={() => handleRemoveEstrutura(estrutura.id)} className="text-gray-400 hover:text-red-500">
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {estrutura.variacoes.map((variacao) => (
                                              <div
                                                key={variacao.id}
                                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs cursor-pointer ${
                                                  variacao.checked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                                }`}
                                                onClick={() => toggleVariacao(variacao.id, !variacao.checked)}
                                              >
                                                {variacao.checked && <Check className="w-2 h-2" />}
                                                <span>{variacao.nome}</span>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); handleRemoveVariacao(variacao.id); }}
                                                  className="text-gray-400 hover:text-red-500"
                                                >
                                                  <X className="w-2 h-2" />
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => handleAddVariacao(estrutura.id)}
                                              className="px-1 py-0.5 rounded text-xs text-blue-600 hover:bg-blue-50"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => handleAddEstrutura(formato.id)}
                                        className="px-2 py-1.5 rounded border border-dashed border-gray-300 text-xs text-gray-500 hover:text-blue-600 hover:border-blue-300"
                                      >
                                        + E
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
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