"use client";

import { useState, useMemo } from "react";
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
import { Plus, Trash2, TextCursorInput, Image as ImageIcon, Save, Search, RefreshCw, Pencil, Check } from "lucide-react";
import { createRepescagemEmpreendimento, updateRepescagemTextoEImagem, deleteRepescagemEmpreendimento, resetarEdicaoManual } from "@/lib/actions";

interface Numero {
  id: string;
  campoNome: string;
  valorAtual: string | null;
}

interface Empreendimento {
  id: string;
  nomeEmpreendimento: string;
  textoConteudo: string | null;
  linkImagem: string | null;
  dataUltimaAtualizacao: Date | null;
  numeros: Numero[];
  editadoManualmente: boolean;
}

interface Props {
  empreendimentos: Empreendimento[];
}

export function RepescagemClient({ empreendimentos: initial }: Props) {
  const [empreendimentos, setEmpreendimentos] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState<Record<string, string | undefined>>({});
  const [editImagem, setEditImagem] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [addingEmp, setAddingEmp] = useState(false);
  const [newEmpNome, setNewEmpNome] = useState("");
  const [busca, setBusca] = useState("");

  const empreendimentosFiltrados = useMemo(() => {
    if (!busca.trim()) return empreendimentos;
    const q = busca.toLowerCase();
    return empreendimentos.filter(e =>
      e.nomeEmpreendimento.toLowerCase().includes(q)
    );
  }, [empreendimentos, busca]);

  const handleCreateEmpreendimento = async () => {
    if (!newEmpNome.trim()) return;
    setAddingEmp(true);
    try {
      const result = await fetch('/api/create-empreendimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeEmpreendimento: newEmpNome.trim() }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'Erro desconhecido');
      setNewEmpNome("");
      window.location.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Erro ao criar empreendimento: " + errorMessage);
    } finally {
      setAddingEmp(false);
    }
  };

  const handleDeleteEmpreendimento = async (id: string) => {
    if (!confirm("Excluir este empreendimento e todos os seus números?")) return;
    await deleteRepescagemEmpreendimento(id);
    setEmpreendimentos((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async (id: string) => {
    const texto = editTexto[id] ?? empreendimentos.find(e => e.id === id)?.textoConteudo ?? "";
    const imagem = editImagem[id] ?? empreendimentos.find(e => e.id === id)?.linkImagem ?? "";
    setSaving(id);
    try {
      await updateRepescagemTextoEImagem(id, texto, imagem);
      setEmpreendimentos((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, textoConteudo: texto, linkImagem: imagem, dataUltimaAtualizacao: new Date(), editadoManualmente: true }
            : e
        )
      );
      setEditTexto((prev) => ({ ...prev, [id]: undefined }));
      setEditImagem((prev) => ({ ...prev, [id]: undefined }));
    } finally {
      setSaving(null);
    }
  };

  const handleResetarEdicaoManual = async (id: string) => {
    if (!confirm("Permitir auditoria automática para este empreendimento?")) return;
    await resetarEdicaoManual(id);
    setEmpreendimentos((prev) =>
      prev.map((e) => e.id === id ? { ...e, editadoManualmente: false } : e)
    );
  };

  const [auditando, setAuditando] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    gerados: number;
    mantidos: number;
    manuais: number;
    erros: number;
    detalhes: { nome: string; status: string; valorNovo?: string; motivo?: string }[];
  } | null>(null);

  const handleAuditar = async () => {
    if (!confirm("Auditar números da planilha? Isso vai atualizar os textos de TODOS os empreendimentos.")) return;
    setAuditando(true);
    setAuditResult(null);
    try {
      const res = await fetch("/api/auditar-repescagem", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setAuditResult(data);
      if (data.gerados > 0 || data.erros > 0) window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Erro na auditoria: " + msg);
    } finally {
      setAuditando(false);
    }
  };

  const getTexto = (emp: Empreendimento) =>
    editTexto[emp.id] !== undefined ? editTexto[emp.id] : emp.textoConteudo ?? "";

  const getImagem = (emp: Empreendimento) =>
    editImagem[emp.id] !== undefined ? editImagem[emp.id] : emp.linkImagem ?? "";

  const hasChanges = (emp: Empreendimento) =>
    editTexto[emp.id] !== undefined || editImagem[emp.id] !== undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Repescagem</h1>
        <p className="text-gray-500">
          Conteúdo de empreendimentos para mídia — textos e imagens para
          disparo de campanhas
        </p>
      </div>

      {/* Barra de busca + botão auditar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar empreendimento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleAuditar}
          disabled={auditando}
          className="shrink-0 h-10 border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          {auditando ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Auditar números
        </Button>
      </div>

      {/* Resultado da auditoria */}
      {auditResult && !auditando && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Auditoria completa!</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-green-700 ml-6">
              {auditResult.gerados > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">ajustado</span>
                  {auditResult.gerados}
                </span>
              )}
              {auditResult.mantidos > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">mantido</span>
                  {auditResult.mantidos}
                </span>
              )}
              {auditResult.manuais > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">editado</span>
                  {auditResult.manuais}
                </span>
              )}
              {auditResult.erros > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">erro</span>
                  {auditResult.erros}
                </span>
              )}
            </div>
            {auditResult.detalhes.filter(d => d.status === "erro" || d.status === "manual").length > 0 && (
              <div className="mt-2 ml-6 space-y-1">
                {auditResult.detalhes.filter(d => d.status === "erro").map(d => (
                  <p key={d.nome} className="text-xs text-red-600">{d.nome}: {d.motivo}</p>
                ))}
                {auditResult.detalhes.filter(d => d.status === "manual").map(d => (
                  <p key={d.nome} className="text-xs text-yellow-600">{d.nome}: edição manual — não atualizado</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form adicionar empreendimento */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do empreendimento..."
              value={newEmpNome}
              onChange={(e) => setNewEmpNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateEmpreendimento();
              }}
              className="flex-1"
            />
            <Button onClick={handleCreateEmpreendimento} disabled={addingEmp || !newEmpNome.trim()}>
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de empreendimentos */}
      {empreendimentosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <TextCursorInput className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{busca ? "Nenhum empreendimento encontrado." : "Nenhum empreendimento cadastrado."}</p>
          {!busca && <p className="text-sm">Adicione acima para começar.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{empreendimentosFiltrados.length} de {empreendimentos.length} empreendimentos</p>
          {empreendimentosFiltrados.map((emp) => {
            const numValor = emp.numeros.find(n => n.campoNome.toLowerCase().includes("valor") && n.campoNome.toLowerCase().includes("total"));
            const numEntrada = emp.numeros.find(n => n.campoNome.toLowerCase().includes("entrada"));
            const temValor = numValor?.valorAtual;
            const temEntrada = numEntrada?.valorAtual;

            return (
              <Card key={emp.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        {expandedId === emp.id ? "▼" : "▶"}
                      </button>
                      <CardTitle className="text-base">{emp.nomeEmpreendimento}</CardTitle>
                      {emp.linkImagem && (
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                      )}
                      {emp.editadoManualmente && (
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">editado</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEmpreendimento(emp.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {emp.dataUltimaAtualizacao && (
                    <p className="text-xs text-gray-400 mt-1">
                      Atualizado em {new Date(emp.dataUltimaAtualizacao).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardHeader>

                {expandedId === emp.id && (
                  <CardContent className="space-y-4">
                    {/* Imagem */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Link da Imagem</label>
                      <Input
                        type="url"
                        placeholder="Cole aqui o link da imagem para o disparo..."
                        value={getImagem(emp)}
                        onChange={(e) => setEditImagem((prev) => ({ ...prev, [emp.id]: e.target.value }))}
                        className="text-sm"
                      />
                      {getImagem(emp) && (
                        <div className="mt-2">
                          <img
                            src={getImagem(emp)}
                            alt="Preview"
                            className="max-h-32 rounded-lg border border-gray-200"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Texto do empreendimento */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Texto do Empreendimento</label>
                      <Textarea
                        value={getTexto(emp)}
                        onChange={(e) => setEditTexto((prev) => ({ ...prev, [emp.id]: e.target.value }))}
                        rows={10}
                        placeholder="Cole aqui o texto de marketing do empreendimento..."
                        className="text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      {emp.editadoManualmente && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetarEdicaoManual(emp.id)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          Liberar auditoria
                        </Button>
                      )}
                      <Button
                        onClick={() => handleSave(emp.id)}
                        disabled={saving === emp.id || !hasChanges(emp)}
                      >
                        <Save className="w-4 h-4" />
                        {saving === emp.id ? "Salvando..." : "Salvar Tudo"}
                      </Button>
                    </div>

                    {/* Valores da Cota */}
                    {emp.numeros.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="mb-2">
                          <label className="text-sm font-medium text-gray-700">Valores da Cota</label>
                        </div>
                        <div className="space-y-2">
                          {emp.numeros.map((num) => {
                            const isValor = num.campoNome.toLowerCase().includes("valor") && num.campoNome.toLowerCase().includes("total");
                            const isEntrada = num.campoNome.toLowerCase().includes("entrada");
                            if (!isValor && !isEntrada) {
                              return (
                                <div key={num.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200">
                                  <span className="text-sm font-medium text-gray-600">{num.campoNome}</span>
                                  <span className="ml-auto text-sm text-gray-500 font-mono">{num.valorAtual ?? "—"}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={num.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200">
                                <span className="text-sm font-medium text-gray-600">{num.campoNome}</span>
                                <span className="ml-auto text-sm text-gray-500 font-mono">{num.valorAtual ?? "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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