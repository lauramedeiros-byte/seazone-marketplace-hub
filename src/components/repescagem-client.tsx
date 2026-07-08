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
import { Plus, Trash2, TextCursorInput, Image as ImageIcon, Save, Search, Copy, Check, HelpCircle, ExternalLink } from "lucide-react";
import { updateRepescagemTextoEImagem, deleteRepescagemEmpreendimento } from "@/lib/actions";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGuia, setShowGuia] = useState(false);

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

  const handleCopiarTexto = async (emp: Empreendimento) => {
    const texto = getTexto(emp);
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para navegadores/contextos sem clipboard API
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId((cur) => (cur === emp.id ? null : cur)), 2000);
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

      {/* Passo a passo para ajustar os números */}
      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <button
          onClick={() => setShowGuia((v) => !v)}
          className="w-full flex items-center gap-2 p-4 text-left"
        >
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-sm font-semibold text-blue-800">
            Como ajustar os números (passo a passo)
          </span>
          <span className="ml-auto text-blue-600 text-sm">{showGuia ? "▼" : "▶"}</span>
        </button>
        {showGuia && (
          <CardContent className="pt-0 pb-4">
            <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700">
              <li>
                Acesse o{" "}
                <a
                  href="https://spotometro.seazone.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
                >
                  Spotômetro
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </li>
              <li>Vá na aba <strong>Revendas</strong>.</li>
              <li>No filtro à esquerda, selecione apenas os <strong>Disponíveis</strong>.</li>
              <li>Por empreendimento, pegue o <strong>menor &ldquo;Valor de repasse&rdquo;</strong>.</li>
              <li>Ajuste esse valor no <strong>texto do empreendimento</strong> aqui.</li>
              <li>Confira também se o <strong>faturamento do empreendimento</strong> não mudou.</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* Barra de busca */}
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
                      Última edição: {new Date(emp.dataUltimaAtualizacao).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                      <Button
                        variant="outline"
                        onClick={() => handleCopiarTexto(emp)}
                        disabled={!getTexto(emp)}
                      >
                        {copiedId === emp.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar texto
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleSave(emp.id)}
                        disabled={saving === emp.id || !hasChanges(emp)}
                      >
                        <Save className="w-4 h-4" />
                        {saving === emp.id ? "Salvando..." : "Salvar Tudo"}
                      </Button>
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
