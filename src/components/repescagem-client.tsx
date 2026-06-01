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
import { Plus, Trash2, TextCursorInput, CheckCircle2, Image as ImageIcon, Save, Search, RotateCcw, Circle, Check, RefreshCw } from "lucide-react";
import { createRepescagemEmpreendimento, updateRepescagemTextoEImagem, deleteRepescagemEmpreendimento, createRepescagemNumero, updateRepescagemNumero, deleteRepescagemNumero, resetarAuditoria } from "@/lib/actions";

interface Numero {
  id: string;
  campoNome: string;
  valorAtual: string | null;
  sinalizador: string | null;
  verificado: boolean;
  dataVerificado: Date | null;
}

interface Empreendimento {
  id: string;
  nomeEmpreendimento: string;
  textoConteudo: string | null;
  linkImagem: string | null;
  dataUltimaAtualizacao: Date | null;
  numeros: Numero[];
}

interface Props {
  empreendimentos: Empreendimento[];
}

export function RepescagemClient({ empreendimentos: initial }: Props) {
  const { user } = useUser();
  const [empreendimentos, setEmpreendimentos] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState<Record<string, string | undefined>>({});
  const [editImagem, setEditImagem] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [addingEmp, setAddingEmp] = useState(false);
  const [newEmpNome, setNewEmpNome] = useState("");
  const [addingNum, setAddingNum] = useState<string | null>(null);
  const [newNumCampo, setNewNumCampo] = useState("");
  const [busca, setBusca] = useState("");

  const empreendimentosFiltrados = useMemo(() => {
    if (!busca.trim()) return empreendimentos;
    const q = busca.toLowerCase();
    return empreendimentos.filter(e =>
      e.nomeEmpreendimento.toLowerCase().includes(q)
    );
  }, [empreendimentos, busca]);

  const totalNumeros = useMemo(() => {
    return empreendimentos.reduce((acc, e) => acc + e.numeros.length, 0);
  }, [empreendimentos]);

  const numerosVerificados = useMemo(() => {
    return empreendimentos.reduce((acc, e) => acc + e.numeros.filter(n => n.verificado).length, 0);
  }, [empreendimentos]);

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
            ? { ...e, textoConteudo: texto, linkImagem: imagem, dataUltimaAtualizacao: new Date() }
            : e
        )
      );
      setEditTexto((prev) => ({ ...prev, [id]: undefined }));
      setEditImagem((prev) => ({ ...prev, [id]: undefined }));
    } finally {
      setSaving(null);
    }
  };

  const handleCreateNumero = async (empreendimentoId: string) => {
    if (!newNumCampo.trim()) return;
    setAddingNum(empreendimentoId);
    try {
      await createRepescagemNumero(empreendimentoId, newNumCampo.trim(), user?.id);
      setNewNumCampo("");
      setAddingNum(null);
      window.location.reload();
    } catch {
      setAddingNum(null);
    }
  };

  const handleUpdateNumeroValor = async (id: string, valor: string, campoNome: string, textoAtual: string) => {
    await updateRepescagemNumero(id, { valorAtual: valor });

    setEmpreendimentos((prev) =>
      prev.map((e) => ({
        ...e,
        numeros: e.numeros.map((n) =>
          n.id === id ? { ...n, valorAtual: valor } : n
        ),
      }))
    );

    if (textoAtual && textoAtual.trim()) {
      const textoAtualizado = atualizarNumeroNoTexto(textoAtual, campoNome, valor);
      if (textoAtualizado !== textoAtual) {
        const empId = empreendimentos.find((e) => e.numeros.some((n) => n.id === id))?.id;
        if (empId) {
          const imgAtual = empreendimentos.find((e) => e.id === empId)?.linkImagem ?? "";
          setEditTexto((prev) => ({ ...prev, [empId]: textoAtualizado }));
          await updateRepescagemTextoEImagem(empId, textoAtualizado, imgAtual);
          setEmpreendimentos((prev) =>
            prev.map((e) =>
              e.id === empId ? { ...e, textoConteudo: textoAtualizado, dataUltimaAtualizacao: new Date() } : e
            )
          );
        }
      }
    }
  };

  const handleToggleVerificado = async (id: string, verificado: boolean) => {
    // Atualiza UI imediatamente (otimista)
    setEmpreendimentos((prev) =>
      prev.map((e) => ({
        ...e,
        numeros: e.numeros.map((n) =>
          n.id === id ? { ...n, verificado, dataVerificado: verificado ? new Date() : null } : n
        ),
      }))
    );

    // Salva no banco
    const result = await fetch('/api/toggle-verificado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, verificado }),
    });
    if (!result.ok) {
      console.error("Erro ao salvar:", await result.text());
    }
  };

  const handleResetarAuditoria = async (empreendimentoId: string) => {
    if (!confirm("Resetar auditoria? Todos os números voltarão para 'não verificado'.")) return;
    await resetarAuditoria(empreendimentoId);
    setEmpreendimentos((prev) =>
      prev.map((e) =>
        e.id === empreendimentoId
          ? {
              ...e,
              numeros: e.numeros.map((n) => ({ ...n, verificado: false, dataVerificado: null })),
            }
          : e
      )
    );
  };

  const handleDeleteNumero = async (numeroId: string) => {
    await deleteRepescagemNumero(numeroId);
    setEmpreendimentos((prev) =>
      prev.map((e) => ({
        ...e,
        numeros: e.numeros.filter((n) => n.id !== numeroId),
      }))
    );
  };

  const [auditando, setAuditando] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    atualizados: number;
    ignorados: number;
    erros: number;
    detalhes: { nome: string; status: string; motivo?: string }[];
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
      if (data.atualizados > 0) window.location.reload();
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

  function atualizarNumeroNoTexto(texto: string, campoNome: string, novoValor: string): string {
    const lines = texto.split('\n');
    const campoLower = campoNome.toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(campoLower)) {
        const regex = /((?:R\$\s*)?[\d\.,]+(?:\s*[-–]\s*[\d\.,]+)?)\s*(?:\/|$|\)|;|€|€)/gi;
        const matches = [...line.matchAll(regex)];

        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          if (lastMatch[1]) {
            lines[i] = line.replace(lastMatch[1], novoValor);
            return lines.join('\n');
          }
        }

        const regexValor = /((?:R\$\s*)?[\d\.,]+(?:[-–][\d\.,]+)?)/;
        const valorMatch = line.match(regexValor);
        if (valorMatch && valorMatch[1]) {
          const nextLine = lines[i + 1];
          if (nextLine && /^\s*[\d\.,]+/.test(nextLine)) {
            lines[i + 1] = nextLine.replace(/^(\s*)([\d\.,]+)/, `$1${novoValor}`);
            return lines.join('\n');
          }
        }
      }
    }

    return texto;
  }

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
      {auditResult && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-700">
              {auditResult.atualizados} atualizados, {auditResult.ignorados} ignorados
              {auditResult.erros > 0 && `, ${auditResult.erros} erros`}
            </p>
            {auditResult.detalhes.filter(d => d.status !== "ok").map(d => (
              <p key={d.nome} className="text-xs text-yellow-700 mt-1">
                {d.nome}: {d.motivo}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resumo da auditoria */}
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Progresso da Auditoria</p>
              <p className="text-xs text-gray-500">
                {numerosVerificados} de {totalNumeros} números verificados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Circle className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-600">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-600">Auditado</span>
              </div>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${totalNumeros > 0 ? (numerosVerificados / totalNumeros) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

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
            const empVerificados = emp.numeros.filter(n => n.verificado).length;
            return (
              <Card key={emp.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === emp.id ? null : emp.id)
                        }
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        {expandedId === emp.id ? "▼" : "▶"}
                      </button>
                      <CardTitle className="text-base">
                        {emp.nomeEmpreendimento}
                      </CardTitle>
                      {emp.linkImagem && (
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                      )}
                      {emp.numeros.length > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          empVerificados === emp.numeros.length
                            ? "bg-blue-100 text-blue-700"
                            : empVerificados > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {empVerificados === emp.numeros.length && empVerificados > 0
                            ? "Auditado"
                            : `${empVerificados}/${emp.numeros.length}`}
                        </span>
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
                      Atualizado em{" "}
                      {new Date(emp.dataUltimaAtualizacao).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardHeader>

                {expandedId === emp.id && (
                  <CardContent className="space-y-4">
                    {/* Imagem */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Link da Imagem
                      </label>
                      <Input
                        type="url"
                        placeholder="Cole aqui o link da imagem para o disparo..."
                        value={getImagem(emp)}
                        onChange={(e) =>
                          setEditImagem((prev) => ({
                            ...prev,
                            [emp.id]: e.target.value,
                          }))
                        }
                        className="text-sm"
                      />
                      {getImagem(emp) && (
                        <div className="mt-2">
                          <img
                            src={getImagem(emp)}
                            alt="Preview"
                            className="max-h-32 rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Texto do empreendimento */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Texto do Empreendimento
                      </label>
                      <Textarea
                        value={getTexto(emp)}
                        onChange={(e) =>
                          setEditTexto((prev) => ({
                            ...prev,
                            [emp.id]: e.target.value,
                          }))
                        }
                        rows={8}
                        placeholder="Cole aqui o texto de marketing do empreendimento..."
                        className="text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetarAuditoria(emp.id)}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Resetar Auditoria
                      </Button>
                      <Button
                        onClick={() => handleSave(emp.id)}
                        disabled={saving === emp.id || !hasChanges(emp)}
                      >
                        <Save className="w-4 h-4" />
                        {saving === emp.id ? "Salvando..." : "Salvar Tudo"}
                      </Button>
                    </div>

                    {/* Números para auditar */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Números para Auditar
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Campo (ex: IPTU, m²)..."
                            value={addingNum === emp.id ? newNumCampo : ""}
                            onChange={(e) => {
                              setAddingNum(emp.id);
                              setNewNumCampo(e.target.value);
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                await handleCreateNumero(emp.id);
                              }
                            }}
                            className="w-48 h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateNumero(emp.id)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {emp.numeros.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          Nenhum número cadastrado.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {emp.numeros.map((num) => (
                            <div
                              key={num.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                num.verificado
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <button
                                onClick={() => handleToggleVerificado(num.id, !num.verificado)}
                                className={`shrink-0 p-1 rounded-full transition-colors ${
                                  num.verificado
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                                }`}
                                title={num.verificado ? "Desfazer auditoria" : "Marcar como auditado"}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <div className="flex-1">
                                <span className={`text-sm font-medium ${
                                  num.verificado ? "text-blue-700" : "text-gray-600"
                                }`}>
                                  {num.campoNome}
                                </span>
                                {num.verificado && num.dataVerificado && (
                                  <span className="text-xs text-blue-500 ml-2">
                                    Auditado em {new Date(num.dataVerificado).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                              </div>
                              <Input
                                value={num.valorAtual ?? ""}
                                onChange={(e) =>
                                  handleUpdateNumeroValor(num.id, e.target.value, num.campoNome, emp.textoConteudo ?? "")
                                }
                                placeholder="Valor..."
                                className="w-40 h-8 text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteNumero(num.id)}
                                className="text-gray-400 hover:text-red-600 shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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