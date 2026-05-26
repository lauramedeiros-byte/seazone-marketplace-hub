"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  RefreshCw,
  Database,
  Search,
} from "lucide-react";
import {
  createArtefato,
  updateArtefato,
  deleteArtefato,
} from "@/lib/actions";

interface Artefato {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  descricaoDados: string | null;
}

interface Props {
  artefatos: Artefato[];
}

const tipoLabel: Record<string, string> = {
  cotas_mercado: "Cotas de Marketplace",
  empreendimentos: "Empreendimentos",
  precos: "Preços",
  farol_criativos: "Farol de Criativos",
  erros_mia: "Erros MIA",
 Outros: "Outros",
};

export function ArtefatosClient({ artefatos: initial }: Props) {
  const { user } = useUser();
  const [artefatos, setArtefatos] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    tipo: "",
    titulo: "",
    descricao: "",
    descricaoDados: "",
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newForm.tipo || !newForm.titulo.trim()) return;
    if (!user) return;
    setCreating(true);
    try {
      const artefato = await createArtefato({
        tipo: newForm.tipo,
        titulo: newForm.titulo,
        descricao: newForm.descricao || undefined,
        descricaoDados: newForm.descricaoDados || undefined,
        userId: user.id,
      });
      setArtefatos((prev) => [...prev, artefato]);
      setNewForm({ tipo: "", titulo: "", descricao: "", descricaoDados: "" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este artefato?")) return;
    await deleteArtefato(id);
    setArtefatos((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Artefatos de Consulta
        </h1>
        <p className="text-gray-500">
          Ferramentas rápidas de consulta — cotas, empreendimentos, preços e
          mais
        </p>
        <p className="text-sm text-gray-400 mt-1">
          As integrações com as fontes de dados serão configuradas uma a uma.
        </p>
      </div>

      {/* Criar novo */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input
              placeholder="Título..."
              value={newForm.titulo}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, titulo: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Input
              placeholder="Tipo (ex: cotas_mercado)..."
              value={newForm.tipo}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, tipo: e.target.value }))
              }
            />
            <Input
              placeholder="Descrição..."
              value={newForm.descricao}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, descricao: e.target.value }))
              }
            />
            <Input
              placeholder="Fonte (nome da planilha/API)..."
              value={newForm.descricaoDados}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, descricaoDados: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating || !newForm.titulo || !newForm.tipo}>
              <Plus className="w-4 h-4" />
              Adicionar Artefato
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de artefatos */}
      {artefatos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum artefato cadastrado.</p>
          <p className="text-sm">Adicione acima para criar uma nova ferramenta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artefatos.map((a) => (
            <Card key={a.id} className="hover:border-blue-200 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    {a.tipo && (
                      <Badge variant="secondary" className="mb-1">
                        {tipoLabel[a.tipo] ?? a.tipo}
                      </Badge>
                    )}
                    <CardTitle className="text-base">{a.titulo}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(a.id)}
                    className="text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {a.descricao && (
                  <CardDescription className="mb-2">
                    {a.descricao}
                  </CardDescription>
                )}
                {a.descricaoDados && (
                  <p className="text-xs text-gray-400">
                    Fonte: {a.descricaoDados}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setActiveId(activeId === a.id ? null : a.id)}
                >
                  <Search className="w-4 h-4" />
                  Consultar
                </Button>
                {activeId === a.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
                    Configure a integração com a fonte de dados para visualizar
                    os dados aqui.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
