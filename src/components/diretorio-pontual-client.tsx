"use client";

import { useMemo, useState } from "react";
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
  Loader2,
  Folder,
  FolderOpen,
  ChevronRight,
  Archive,
} from "lucide-react";

type Item = {
  id: string;
  ano: number;
  titulo: string;
  url: string | null;
  nota: string | null;
};

type Form = { titulo: string; url: string; nota: string; ano: number };

const ANO_ATUAL = new Date().getFullYear();

const formVazio = (ano: number): Form => ({ titulo: "", url: "", nota: "", ano });

async function api(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch("/api/diretorio-pontual", {
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

export function DiretorioPontualClient({ itensInit }: { itensInit: Item[] }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [form, setForm] = useState<Form>(formVazio(ANO_ATUAL));
  // Pasta do ano corrente começa aberta; as antigas, fechadas
  const [anosAbertos, setAnosAbertos] = useState<Set<number>>(new Set([ANO_ATUAL]));
  const [itemAberto, setItemAberto] = useState<string | null>(null);

  // O ano corrente sempre aparece, mesmo vazio, para ter onde guardar a primeira coisa
  const pastas = useMemo(() => {
    const anos = new Set<number>([ANO_ATUAL, ...itensInit.map((i) => i.ano)]);
    return [...anos]
      .sort((a, b) => b - a)
      .map((ano) => ({ ano, itens: itensInit.filter((i) => i.ano === ano) }));
  }, [itensInit]);

  // Opções do seletor de pasta: do ano mais antigo guardado até o próximo ano
  const anosOpcoes = useMemo(() => {
    const min = Math.min(ANO_ATUAL, ...itensInit.map((i) => i.ano));
    const lista: number[] = [];
    for (let a = ANO_ATUAL + 1; a >= min; a--) lista.push(a);
    return lista;
  }, [itensInit]);

  function alternarAno(ano: number) {
    setAnosAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(ano)) novo.delete(ano);
      else novo.add(ano);
      return novo;
    });
  }

  function abrirNovo(ano: number = ANO_ATUAL) {
    setEditando(null);
    setForm(formVazio(ano));
    setErro(null);
    setDialogAberto(true);
  }

  function abrirEdicao(i: Item) {
    setEditando(i);
    setForm({ titulo: i.titulo, url: i.url ?? "", nota: i.nota ?? "", ano: i.ano });
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
    if (!form.titulo.trim()) {
      setErro("Dê um título para a coisa.");
      return;
    }
    const ok = await executar(() =>
      editando
        ? api("update", { id: editando.id, ...form })
        : api("create", form)
    );
    if (ok) {
      setDialogAberto(false);
      setAnosAbertos((prev) => new Set(prev).add(form.ano));
    }
  }

  async function excluir(i: Item) {
    if (!confirm(`Excluir "${i.titulo}"? Essa ação não pode ser desfeita.`)) return;
    await executar(() => api("delete", { id: i.id }));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <Archive className="w-3 h-3" />
            Artefatos de Consulta
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Diretório de coisas pontuais
          </h1>
          <p className="text-gray-500 text-sm max-w-xl">
            O que não tem onde encaixar, mas precisa ficar guardado. Uma pasta
            por ano — clique no título para ver o que tem dentro.
          </p>
        </div>
        <Button
          onClick={() => abrirNovo()}
          className="bg-slate-800 hover:bg-slate-900 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Adicionar
        </Button>
      </div>

      {erro && !dialogAberto && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* ── Pastas por ano ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {pastas.map(({ ano, itens }) => {
          const aberta = anosAbertos.has(ano);
          const IconePasta = aberta ? FolderOpen : Folder;
          return (
            <div key={ano} className="rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => alternarAno(ano)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-slate-50 rounded-xl transition-colors"
              >
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${aberta ? "rotate-90" : ""}`}
                />
                <IconePasta className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-gray-900">{ano}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {itens.length} {itens.length === 1 ? "item" : "itens"}
                </span>
              </button>

              {aberta && (
                <div className="border-t border-slate-100 px-2 py-2">
                  {itens.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-gray-400 mb-2">Pasta vazia.</p>
                      <button
                        onClick={() => abrirNovo(ano)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Guardar a primeira coisa de {ano}
                      </button>
                    </div>
                  ) : (
                    <ul className="flex flex-col">
                      {itens.map((i) => {
                        const expandido = itemAberto === i.id;
                        return (
                          <li key={i.id}>
                            <button
                              onClick={() => setItemAberto(expandido ? null : i.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 text-slate-300 shrink-0 transition-transform ${expandido ? "rotate-90" : ""}`}
                              />
                              <span className="text-sm text-gray-800">{i.titulo}</span>
                            </button>

                            {expandido && (
                              <div className="ml-8 mr-2 mb-2 rounded-lg bg-slate-50 border border-slate-100 p-3">
                                {i.url && (
                                  <a
                                    href={i.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5 break-all"
                                  >
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                    {i.url}
                                  </a>
                                )}
                                {i.nota && (
                                  <p className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap ${i.url ? "mt-2" : ""}`}>
                                    {i.nota}
                                  </p>
                                )}
                                {!i.url && !i.nota && (
                                  <p className="text-xs text-gray-400">Sem link nem anotação.</p>
                                )}
                                <div className="flex justify-end gap-1 mt-2">
                                  <button
                                    onClick={() => abrirEdicao(i)}
                                    disabled={salvando}
                                    title="Editar"
                                    className="p-1.5 rounded-md text-gray-400 hover:text-slate-700 hover:bg-white disabled:opacity-30"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => excluir(i)}
                                    disabled={salvando}
                                    title="Excluir"
                                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Formulário ───────────────────────────────────────────────────── */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar" : "Guardar coisa nova"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Título
              </label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Planilha da ação de Black Friday"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Link
              </label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Anotação <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <Textarea
                value={form.nota}
                onChange={(e) => setForm({ ...form, nota: e.target.value })}
                placeholder="Para que serve, de onde veio, quem pediu..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Pasta
              </label>
              <select
                value={form.ano}
                onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {anosOpcoes.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
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
                className="bg-slate-800 hover:bg-slate-900 text-white"
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
