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
import { Plus, Trash2, TextCursorInput, AlertTriangle, CheckCircle2, Image as ImageIcon, Save } from "lucide-react";
import { createRepescagemEmpreendimento, updateRepescagemTextoEImagem, deleteRepescagemEmpreendimento, createRepescagemNumero, updateRepescagemNumero, deleteRepescagemNumero } from "@/lib/actions";

interface Numero {
  id: string;
  campoNome: string;
  valorAtual: string | null;
  sinalizador: string | null;
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

  const handleCreateEmpreendimento = async () => {
    if (!newEmpNome.trim()) return;
    setAddingEmp(true);
    try {
      await createRepescagemEmpreendimento(newEmpNome.trim(), user?.id || undefined);
      setNewEmpNome("");
      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error("Erro ao criar:", error);
      alert("Erro ao criar empreendimento. Tente novamente.");
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

  const handleUpdateNumeroValor = async (id: string, valor: string) => {
    await updateRepescagemNumero(id, { valorAtual: valor });
    setEmpreendimentos((prev) =>
      prev.map((e) => ({
        ...e,
        numeros: e.numeros.map((n) =>
          n.id === id ? { ...n, valorAtual: valor } : n
        ),
      }))
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
      {empreendimentos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <TextCursorInput className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum empreendimento cadastrado.</p>
          <p className="text-sm">Adicione acima para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {empreendimentos.map((emp) => (
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
                    {emp.numeros.some((n) => n.sinalizador === "alterado") && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    {emp.numeros.length > 0 &&
                      emp.numeros.every((n) => n.sinalizador === "ok") && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                    {new Date(emp.dataUltimaAtualizacao).toLocaleDateString(
                      "pt-BR"
                    )}
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

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave(emp.id)}
                      disabled={saving === emp.id || !hasChanges(emp)}
                    >
                      <Save className="w-4 h-4" />
                      {saving === emp.id ? "Salvando..." : "Salvar Tudo"}
                    </Button>
                  </div>

                  {/* Farol de números */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Números para Auditar
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Campo (ex: IPTU, m²)..."
                          value={
                            addingNum === emp.id ? newNumCampo : ""
                          }
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
                        Nenhum número cadastrado. Adicione acima os campos que
                        deseja auditar.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {emp.numeros.map((num) => (
                          <div
                            key={num.id}
                            className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 bg-gray-50"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {num.campoNome}
                              </span>
                              {num.sinalizador && (
                                <span
                                  className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                                    num.sinalizador === "ok"
                                      ? "bg-green-100 text-green-700"
                                      : num.sinalizador === "alterado"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {num.sinalizador === "ok"
                                    ? "OK"
                                    : num.sinalizador === "alterado"
                                    ? "Alterado"
                                    : "Não verificado"}
                                </span>
                              )}
                            </div>
                            <Input
                              value={num.valorAtual ?? ""}
                              onChange={(e) =>
                                handleUpdateNumeroValor(num.id, e.target.value)
                              }
                              placeholder="Valor..."
                              className="w-32 h-8 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNumero(num.id)}
                              className="text-gray-400 hover:text-red-600"
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
          ))}
        </div>
      )}
    </div>
  );
}