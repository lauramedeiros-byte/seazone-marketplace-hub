"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, ExternalLink, Save, X, Edit2, Check } from "lucide-react";

interface Link {
  titulo: string;
  url: string;
}

interface Campanha {
  id: string;
  nome: string;
  contexto: string | null;
  links: Link[];
  ordem: number;
  criadoEm: string;
  atualizadoEm: string;
}

export function CampanhasClient() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ nome: string; contexto: string; links: Link[] }>({
    nome: "",
    contexto: "",
    links: [],
  });

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const fetchCampanhas = async () => {
    try {
      const res = await fetch("/api/campanhas");
      const data = await res.json();
      setCampanhas(data);
    } catch (err) {
      console.error("Erro ao buscar campanhas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newNome.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/campanhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newNome.trim(), links: [] }),
      });
      if (!res.ok) throw new Error("Erro ao criar");
      const campanha = await res.json();
      setCampanhas((prev) => [...prev, campanha]);
      setNewNome("");
      setEditingId(campanha.id);
      setEditForm({ nome: campanha.nome, contexto: "", links: [] });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar campanha");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta campanha?")) return;
    try {
      await fetch(`/api/campanhas/${id}`, { method: "DELETE" });
      setCampanhas((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir");
    }
  };

  const startEdit = (campanha: Campanha) => {
    setEditingId(campanha.id);
    setEditForm({
      nome: campanha.nome,
      contexto: campanha.contexto || "",
      links: campanha.links || [],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ nome: "", contexto: "", links: [] });
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editForm.nome,
          contexto: editForm.contexto || null,
          links: editForm.links,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const updated = await res.json();
      setCampanhas((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    }
  };

  const addLink = () => {
    setEditForm((prev) => ({
      ...prev,
      links: [...prev.links, { titulo: "", url: "" }],
    }));
  };

  const updateLink = (index: number, field: keyof Link, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      links: prev.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const removeLink = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        Carregando campanhas...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Form criar nova campanha */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova campanha..."
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1"
            />
            <Button onClick={handleCreate} disabled={creating || !newNome.trim()}>
              <Plus className="w-4 h-4" />
              Nova Campanha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de campanhas */}
      {campanhas.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhuma campanha criada.</p>
          <p className="text-sm mt-1">Use o formulário acima para criar a primeira.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campanhas.map((campanha) => (
            <Card key={campanha.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {editingId === campanha.id ? (
                    <Input
                      value={editForm.nome}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                      className="flex-1 mr-2"
                      placeholder="Nome da campanha"
                    />
                  ) : (
                    <CardTitle className="text-lg">{campanha.nome}</CardTitle>
                  )}
                  <div className="flex gap-2">
                    {editingId === campanha.id ? (
                      <>
                        <Button size="sm" onClick={() => handleSave(campanha.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(campanha)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(campanha.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contexto */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Contexto da campanha
                  </label>
                  {editingId === campanha.id ? (
                    <Textarea
                      value={editForm.contexto}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contexto: e.target.value }))}
                      placeholder="Descreva o contexto desta campanha..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {campanha.contexto || <span className="text-gray-400 italic">Sem contexto definido</span>}
                    </p>
                  )}
                </div>

                {/* Links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Links ({campanha.links?.length || 0})
                    </label>
                    {editingId === campanha.id && (
                      <Button size="sm" variant="outline" onClick={addLink}>
                        <Plus className="w-4 h-4" />
                        Adicionar Link
                      </Button>
                    )}
                  </div>

                  {editingId === campanha.id ? (
                    <div className="space-y-2">
                      {editForm.links.map((link, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Título do link"
                            value={link.titulo}
                            onChange={(e) => updateLink(index, "titulo", e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => updateLink(index, "url", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeLink(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {editForm.links.length === 0 && (
                        <p className="text-sm text-gray-400">Nenhum link adicionado.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {campanha.links?.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">{link.titulo}</span>
                          <span className="text-xs text-gray-400 truncate flex-1">{link.url}</span>
                        </a>
                      ))}
                      {(!campanha.links || campanha.links.length === 0) && (
                        <p className="text-sm text-gray-400">Nenhum link adicionado.</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}