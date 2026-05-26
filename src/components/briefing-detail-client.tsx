"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Lock, Save } from "lucide-react";
import { updateBriefing } from "@/lib/actions";

interface BriefingDetail {
  id: string;
  titulo: string;
  empresa: string | null;
  canal: string | null;
  formularioJson: unknown;
  status: string;
  codigoProtecao: string | null;
  dataPublicacao: Date | null;
}

interface Props {
  briefing: BriefingDetail | null;
}

export function BriefingDetailClient({ briefing: initial }: Props) {
  const [briefing, setBriefing] = useState(initial);
  const [form, setForm] = useState({
    titulo: initial?.titulo ?? "",
    empresa: initial?.empresa ?? "",
    canal: initial?.canal ?? "",
    codigoProtecao: initial?.codigoProtecao ?? "",
  });
  const [formJson, setFormJson] = useState(
    initial?.formularioJson ? JSON.stringify(initial.formularioJson, null, 2) : ""
  );
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(!initial?.codigoProtecao);
  const [checkCode, setCheckCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [lockForm, setLockForm] = useState(true);

  if (!briefing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/briefings">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 mb-4">
            ← Voltar aos Briefings
          </Button>
        </Link>
        <div className="text-center py-12 text-gray-400">
          <p>Briefing não encontrado.</p>
        </div>
      </div>
    );
  }

  if (briefing.codigoProtecao && !unlocked) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/briefings">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 mb-4">
            ← Voltar aos Briefings
          </Button>
        </Link>
        <div className="text-center py-16">
          <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Briefing Protegido
          </h2>
          <p className="text-gray-500 mb-6">
            Este briefing está protegido. Digite o código para acessar.
          </p>
          <Input
            type="password"
            placeholder="Código de acesso..."
            value={checkCode}
            onChange={(e) => {
              setCheckCode(e.target.value);
              setCodeError(false);
            }}
            className="mb-3"
          />
          {codeError && (
            <p className="text-red-500 text-sm mb-3">Código incorreto.</p>
          )}
          <Button
            onClick={() => {
              if (checkCode === briefing.codigoProtecao) {
                setUnlocked(true);
              } else {
                setCodeError(true);
              }
            }}
          >
            Acessar
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedJson: unknown = undefined;
      if (formJson.trim()) {
        try {
          parsedJson = JSON.parse(formJson);
        } catch {
          alert("JSON inválido no campo formularioJson");
          setSaving(false);
          return;
        }
      }
      await updateBriefing(briefing.id, {
        titulo: form.titulo,
        empresa: form.empresa || undefined,
        canal: form.canal || undefined,
        codigoProtecao: form.codigoProtecao || undefined,
        formularioJson: parsedJson,
      });
      setBriefing((prev) =>
        prev
          ? {
              ...prev,
              titulo: form.titulo,
              empresa: form.empresa || null,
              canal: form.canal || null,
              codigoProtecao: form.codigoProtecao || null,
              formularioJson: parsedJson,
            }
          : prev
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link href="/briefings">
        <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 mb-4">
          ← Voltar aos Briefings
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <Input
                value={form.titulo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, titulo: e.target.value }))
                }
                placeholder="Título..."
                className="text-xl font-bold border-0 p-0 h-auto focus:ring-0 focus-visible:ring-0 placeholder:text-gray-900 bg-transparent"
              />
              <div className="flex gap-2 mt-1">
                <Badge
                  variant={
                    briefing.status === "ativo"
                      ? "success"
                      : briefing.status === "arquivado"
                      ? "outline"
                      : "secondary"
                  }
                >
                  {briefing.status === "ativo"
                    ? "Ativo"
                    : briefing.status === "arquivado"
                    ? "Arquivado"
                    : "Rascunho"}
                </Badge>
                {briefing.codigoProtecao && (
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Protegido
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">Empresa</label>
              <Input
                value={form.empresa}
                onChange={(e) =>
                  setForm((p) => ({ ...p, empresa: e.target.value }))
                }
                placeholder="Empresa / Interno..."
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">Canal</label>
              <Input
                value={form.canal}
                onChange={(e) =>
                  setForm((p) => ({ ...p, canal: e.target.value }))
                }
                placeholder="Canal..."
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-500">Formulário (JSON)</label>
              <button
                onClick={() => setLockForm(!lockForm)}
                className="text-xs text-blue-600 hover:underline"
              >
                {lockForm ? "Desbloquear edição" : "Bloquear edição"}
              </button>
            </div>
            <Textarea
              value={formJson}
              onChange={(e) => setFormJson(e.target.value)}
              rows={8}
              placeholder='{\n  "campo1": "valor"\n}'
              className="font-mono text-xs"
              readOnly={lockForm}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
