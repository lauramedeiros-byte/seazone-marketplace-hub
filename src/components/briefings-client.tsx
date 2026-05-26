"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { createBriefing, updateBriefing, deleteBriefing } from "@/lib/actions";

interface Briefing {
  id: string;
  titulo: string;
  empresa: string | null;
  canal: string | null;
  status: string;
  codigoProtecao: string | null;
  dataPublicacao: Date | null;
}

interface Props {
  briefings: Briefing[];
}

const statusBadge: Record<string, { label: string; variant: string }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  ativo: { label: "Ativo", variant: "success" },
  arquivado: { label: "Arquivado", variant: "outline" },
};

export function BriefingsClient({ briefings: initial }: Props) {
  const { user } = useUser();
  const [briefings, setBriefings] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    titulo: "",
    empresa: "",
    canal: "",
    codigoProtecao: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<typeof newForm>>({});

  const handleCreate = async () => {
    if (!newForm.titulo.trim()) return;
    if (!user) return;
    setCreating(true);
    try {
      await createBriefing({
        titulo: newForm.titulo,
        empresa: newForm.empresa || null,
        canal: newForm.canal || null,
        codigoProtecao: newForm.codigoProtecao || null,
        userId: user.id,
      });
      setBriefings((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          titulo: newForm.titulo,
          empresa: newForm.empresa || null,
          canal: newForm.canal || null,
          status: "rascunho",
          codigoProtecao: newForm.codigoProtecao || null,
          dataPublicacao: null,
        },
      ]);
      setNewForm({ titulo: "", empresa: "", canal: "", codigoProtecao: "" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este briefing?")) return;
    await deleteBriefing(id);
    setBriefings((prev) => prev.filter((b) => b.id !== id));
  };

  const handleStatusToggle = async (b: Briefing) => {
    const next = b.status === "rascunho" ? "ativo" : b.status === "ativo" ? "arquivado" : "rascunho";
    await updateBriefing(b.id, {
      status: next,
      dataPublicacao: next === "ativo" ? new Date() : undefined,
    });
    setBriefings((prev) =>
      prev.map((br) =>
        br.id === b.id
          ? {
              ...br,
              status: next,
              dataPublicacao: next === "ativo" ? new Date() : null,
            }
          : br
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Briefings</h1>
        <p className="text-gray-500">
          Gerencie briefs de campanha — rascunhos, ativos e arquivados
        </p>
      </div>

      {/* Criar novo */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input
              placeholder="Título do briefing..."
              value={newForm.titulo}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, titulo: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Input
              placeholder="Empresa / Interno..."
              value={newForm.empresa}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, empresa: e.target.value }))
              }
            />
            <Input
              placeholder="Canal (Meta, Google...)"
              value={newForm.canal}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, canal: e.target.value }))
              }
            />
            <Input
              placeholder="Código de proteção (opcional)"
              value={newForm.codigoProtecao}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, codigoProtecao: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating || !newForm.titulo.trim()}>
              <Plus className="w-4 h-4" />
              Criar Briefing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de briefings */}
      {briefings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum briefing cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {briefings.map((b) => {
            const badge = statusBadge[b.status] ?? statusBadge["rascunho"];
            return (
              <Card key={b.id} className="hover:border-blue-200 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base leading-tight">{b.titulo}</CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      {b.codigoProtecao ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-gray-300" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(b.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge
                      variant={badge.variant as "secondary" | "success" | "outline"}
                    >
                      {badge.label}
                    </Badge>
                    {b.canal && (
                      <Badge variant="secondary">{b.canal}</Badge>
                    )}
                    {b.empresa && (
                      <span className="text-xs text-gray-500">
                        {b.empresa}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusToggle(b)}
                  >
                    {b.status === "rascunho" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Publicar
                      </>
                    ) : b.status === "ativo" ? (
                      "Arquivar"
                    ) : (
                      "Retornar a rascunho"
                    )}
                  </Button>
                  <Link href={`/briefings/${b.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
