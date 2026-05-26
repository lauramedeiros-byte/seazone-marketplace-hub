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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { createMeta, updateMeta, deleteMeta } from "@/lib/actions";

interface Meta {
  id: string;
  trimestre: string;
  metaNome: string;
  tipo: string;
  valorMeta: number;
  valorAtual: number;
}

interface Props {
  initialMetas: Meta[];
  trimestreAtivo: string;
}

const TRIMESTRES = [
  "Q1-2026",
  "Q2-2026",
  "Q3-2026",
  "Q4-2026",
  "Q1-2027",
  "Q2-2027",
];

export function MetasClient({ initialMetas, trimestreAtivo }: Props) {
  const { user } = useUser();
  const [trimestre, setTrimestre] = useState(trimestreAtivo);
  const [metas, setMetas] = useState(initialMetas);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    metaNome: "",
    tipo: "valor",
    valorMeta: "",
    valorAtual: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const filtered = metas.filter((m) => m.trimestre === trimestre);

  const handleCreate = async () => {
    if (!newForm.metaNome.trim() || !newForm.valorMeta) return;
    if (!user) return;
    setCreating(true);
    try {
      const meta = await createMeta({
        trimestre,
        metaNome: newForm.metaNome,
        tipo: newForm.tipo,
        valorMeta: parseFloat(newForm.valorMeta.replace(",", ".")),
        valorAtual: newForm.valorAtual
          ? parseFloat(newForm.valorAtual.replace(",", "."))

 : 0,
        userId: user.id,
      });
      setMetas((prev) => [...prev, meta]);
      setNewForm({ metaNome: "", tipo: "valor", valorMeta: "", valorAtual: "" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta meta?")) return;
    await deleteMeta(id);
    setMetas((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateValor = async (id: string, valorAtual: number) => {
    await updateMeta(id, { valorAtual });
    setMetas((prev) =>
      prev.map((m) => (m.id === id ? { ...m, valorAtual: valorAtual } : m))
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Acompanhamento de Metas
        </h1>
        <p className="text-gray-500">
          Visualize e acompanhe suas metas trimestrais
        </p>
      </div>

      {/* Seletor de trimestre */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Trimestre:</label>
        <Select value={trimestre} onValueChange={setTrimestre}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIMESTRES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} meta(s) neste trimestre
        </span>
      </div>

      {/* Cards de metas */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 mb-6">
          <p>Nenhuma meta neste trimestre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {filtered.map((meta) => {
            const pct = Math.min(100, (meta.valorAtual / meta.valorMeta) * 100);
            return (
              <Card key={meta.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{meta.metaNome}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(meta.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {meta.valorAtual.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-500 font-medium">
                      {meta.valorMeta.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                      {meta.tipo === "volume" ? " un" : " R$"}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        pct >= 100
                          ? "text-green-600"
                          : pct >= 70
                          ? "text-blue-600"
                          : pct >= 40
                          ? "text-amber-500"
                          : "text-red-500"
                      }`}
                    >
                      {pct.toFixed(0)}% atingido
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      Restam{" "}
                      {Math.max(
                        0,
                        meta.valorMeta - meta.valorAtual
                      ).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Atualizar para..."
                      step="any"
                      className="h-8 text-sm"
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          const v = parseFloat(
                            (e.target as HTMLInputElement).value.replace(",", ".")
                          );
                          if (!isNaN(v)) {
                            await handleUpdateValor(meta.id, v);
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Adicionar meta */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Nova Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input
              placeholder="Nome da meta..."
              value={newForm.metaNome}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, metaNome: e.target.value }))
              }
            />
            <Select
              value={newForm.tipo}
              onValueChange={(v) => setNewForm((p) => ({ ...p, tipo: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valor">Valor (R$)</SelectItem>
                <SelectItem value="volume">Volume (un)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Meta..."
              step="any"
              value={newForm.valorMeta}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, valorMeta: e.target.value }))
              }
            />
            <Input
              type="number"
              placeholder="Atual (opcional)..."
              step="any"
              value={newForm.valorAtual}
              onChange={(e) =>
                setNewForm((p) => ({ ...p, valorAtual: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={
                creating || !newForm.metaNome.trim() || !newForm.valorMeta
              }
            >
              <Plus className="w-4 h-4" />
              Adicionar Meta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
