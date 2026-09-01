"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  Megaphone,
  Target,
} from "lucide-react";

type Material = {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string;
  interno: boolean;
};

type Form = { titulo: string; descricao: string; url: string };

const FORM_VAZIO: Form = { titulo: "", descricao: "", url: "" };

// Material fixo: é uma página do próprio hub, versionada no repositório.
// Por isso não entra na lista editável — não faria sentido apagar a rota daqui.
const PAGINA_CRIATIVOS = "/artefatos-de-consulta/materiais-comercial-revendas/criativos-revenda";

async function api(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch("/api/materiais-comercial", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro na requisição");
  }
  return res.json();
}

export function MateriaisComercialClient({
  materiaisInit,
}: {
  materiaisInit: Material[];
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Material | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setErro(null);
    setDialogAberto(true);
  }

  function abrirEdicao(m: Material) {
    setEditando(m);
    setForm({ titulo: m.titulo, descricao: m.descricao ?? "", url: m.url });
    setErro(null);
    setDialogAberto(true);
  }

  async function executar(fn: () => Promise<unknown>) {
    setSalvando(true);
    setErro(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function salvar() {
    if (!form.url.trim()) {
      setErro("Cole o link do material.");
      return;
    }
    const ok = await executar(() =>
      editando
        ? api("update", { id: editando.id, ...form })
        : api("create", form)
    );
    if (ok) setDialogAberto(false);
  }

  async function excluir(m: Material) {
    if (!confirm(`Excluir "${m.titulo}"? Essa ação não pode ser desfeita.`)) return;
    await executar(() => api("delete", { id: m.id }));
  }

  async function mover(m: Material, direcao: "cima" | "baixo") {
    await executar(() => api("mover", { id: m.id, direcao }));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600">
            <Megaphone className="w-3 h-3" />
            Time comercial
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Materiais comercial Revendas
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl">
            Material de apoio para o time comercial de Revendas. Não é
            acompanhamento de marketing — é o que o vendedor consulta antes e
            durante a conversa com o lead.
          </p>
        </div>
        <Button
          onClick={abrirNovo}
          className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Adicionar material
        </Button>
      </div>

      {erro && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* ── Material fixo: página desenhada dentro do hub ─────────────────── */}
      <a href={PAGINA_CRIATIVOS} className="block group mb-6">
        <div className="rounded-xl border-l-4 border-l-orange-500 border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg shrink-0 bg-orange-100 text-orange-600 border border-orange-200">
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Criativos de Revenda — o que sondar do lead
                <ArrowRight className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-600 transition-colors shrink-0" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                Os três grupos de criativos no ar no Meta: o que cada anúncio
                promete, o que o vendedor precisa descobrir na conversa, o
                estoque que sustenta cada promessa e as objeções que vêm da
                peça.
              </p>
            </div>
          </div>
        </div>
      </a>

      {/* ── Lista editável ───────────────────────────────────────────────── */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-3">
        Outros materiais
        <span className="ml-2 font-normal normal-case tracking-normal text-orange-400">
          {materiaisInit.length}{" "}
          {materiaisInit.length === 1 ? "material" : "materiais"}
        </span>
      </h2>

      {materiaisInit.length === 0 ? (
        <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-10 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Nenhum material adicionado ainda.
          </p>
          <Button
            variant="outline"
            onClick={abrirNovo}
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Adicionar o primeiro
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {materiaisInit.map((m, i) => (
            <div
              key={m.id}
              className="rounded-xl border border-orange-100 border-l-4 border-l-orange-400 bg-white p-3.5 flex items-start gap-3 hover:shadow-sm transition-all"
            >
              <div className="flex-1 min-w-0">
                <a
                  href={m.url}
                  {...(m.interno
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="text-sm font-semibold text-gray-900 hover:text-orange-700 inline-flex items-center gap-1.5"
                >
                  {m.titulo}
                  {m.interno ? (
                    <ArrowRight className="w-3 h-3 text-orange-400 shrink-0" />
                  ) : (
                    <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                  )}
                </a>
                {m.descricao && (
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">
                    {m.descricao}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1 truncate">{m.url}</p>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => mover(m, "cima")}
                  disabled={salvando || i === 0}
                  title="Mover para cima"
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => mover(m, "baixo")}
                  disabled={salvando || i === materiaisInit.length - 1}
                  title="Mover para baixo"
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => abrirEdicao(m)}
                  disabled={salvando}
                  title="Editar"
                  className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-30"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => excluir(m)}
                  disabled={salvando}
                  title="Excluir"
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Formulário ───────────────────────────────────────────────────── */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar material" : "Adicionar material"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Título
              </label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Tabela de cotas por empreendimento"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Link
              </label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://... ou /rota-do-hub"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Link que começa com &quot;/&quot; abre dentro do hub; os demais
                abrem em nova aba.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Descrição
              </label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Para que serve e quando usar"
                rows={3}
              />
            </div>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setDialogAberto(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvar}
                disabled={salvando}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {salvando && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
