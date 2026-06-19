"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ExternalLink, X, Edit2, Check, ChevronDown, ChevronRight, Link as LinkIcon } from "lucide-react";

interface AnaliseLink {
  url: string;
  label: string;
}

interface AnaliseClaude {
  id: string;
  descricao: string;
  links: AnaliseLink[];
  dataAnalise: string;
  criadoEm: string;
  atualizadoEm: string;
}

function semanaDoMes(data: Date): number {
  return Math.ceil(data.getDate() / 7);
}

function labelSemana(semana: number): string {
  return `Semana ${semana}`;
}

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function labelMes(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${meses[parseInt(m) - 1]} ${y}`;
}

const emptyForm = { descricao: "", links: [{ url: "", label: "" }] as AnaliseLink[], dataAnalise: new Date().toISOString().slice(0, 10) };

export function AnalisesClaudeClient({ inicial }: { inicial: AnaliseClaude[] }) {
  const [analises, setAnalises] = useState<AnaliseClaude[]>(inicial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<typeof emptyForm>(emptyForm);
  const [mesesAbertos, setMesesAbertos] = useState<Record<string, boolean>>({});
  const [semanasAbertas, setSemanasAbertas] = useState<Record<string, boolean>>({});

  // Agrupamento: mes -> semana -> analises
  const agrupado = useMemo(() => {
    const map = new Map<string, Map<number, AnaliseClaude[]>>();
    for (const a of analises) {
      const d = new Date(a.dataAnalise);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const sem = semanaDoMes(d);
      if (!map.has(mes)) map.set(mes, new Map());
      const semMap = map.get(mes)!;
      if (!semMap.has(sem)) semMap.set(sem, []);
      semMap.get(sem)!.push(a);
    }
    // Ordenar: meses desc, semanas desc, análises desc
    const meses = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    return meses.map(([mes, semMap]) => ({
      mes,
      semanas: Array.from(semMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([sem, items]) => ({
          sem,
          items: [...items].sort((a, b) => new Date(b.dataAnalise).getTime() - new Date(a.dataAnalise).getTime()),
        })),
    }));
  }, [analises]);

  // Inicializa o primeiro mês aberto por padrão
  const mesAberto = (mes: string) => mesesAbertos[mes] ?? agrupado[0]?.mes === mes;
  const semAberta = (key: string) => semanasAbertas[key] ?? true;

  const toggleMes = (mes: string) => setMesesAbertos(p => ({ ...p, [mes]: !mesAberto(mes) }));
  const toggleSem = (key: string) => setSemanasAbertas(p => ({ ...p, [key]: !semAberta(key) }));

  // ── Criar ──
  const handleCreate = async () => {
    if (!form.descricao.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/analises-claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: form.descricao,
          links: form.links.filter(l => l.url.trim()),
          dataAnalise: form.dataAnalise,
        }),
      });
      if (!res.ok) throw new Error();
      const nova = await res.json();
      setAnalises(p => [nova, ...p]);
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      alert("Erro ao salvar análise");
    } finally {
      setSaving(false);
    }
  };

  // ── Editar ──
  const startEdit = (a: AnaliseClaude) => {
    setEditingId(a.id);
    setEditForm({
      descricao: a.descricao,
      links: a.links.length ? a.links : [{ url: "", label: "" }],
      dataAnalise: a.dataAnalise.slice(0, 10),
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(emptyForm); };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/analises-claude/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: editForm.descricao,
          links: editForm.links.filter(l => l.url.trim()),
          dataAnalise: editForm.dataAnalise,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setAnalises(p => p.map(a => a.id === id ? updated : a));
      setEditingId(null);
    } catch {
      alert("Erro ao salvar");
    }
  };

  // ── Deletar ──
  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta análise?")) return;
    try {
      await fetch(`/api/analises-claude/${id}`, { method: "DELETE" });
      setAnalises(p => p.filter(a => a.id !== id));
    } catch {
      alert("Erro ao excluir");
    }
  };

  // ── Helpers de links ──
  const addLink = (target: typeof form, setTarget: (v: typeof form) => void) =>
    setTarget({ ...target, links: [...target.links, { url: "", label: "" }] });

  const updateLink = (
    target: typeof form,
    setTarget: (v: typeof form) => void,
    i: number,
    field: keyof AnaliseLink,
    val: string
  ) => setTarget({ ...target, links: target.links.map((l, idx) => idx === i ? { ...l, [field]: val } : l) });

  const removeLink = (target: typeof form, setTarget: (v: typeof form) => void, i: number) =>
    setTarget({ ...target, links: target.links.filter((_, idx) => idx !== i) });

  return (
    <div className="max-w-3xl mx-auto">

      {/* Botão nova análise */}
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setShowForm(v => !v)} variant={showForm ? "outline" : "default"}>
          {showForm ? <><X className="w-4 h-4 mr-1" /> Cancelar</> : <><Plus className="w-4 h-4 mr-1" /> Nova análise</>}
        </Button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <Card className="mb-6 border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-800">Nova análise Claude</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Data da análise</label>
              <Input
                type="date"
                value={form.dataAnalise}
                onChange={e => setForm(f => ({ ...f, dataAnalise: e.target.value }))}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
              <Textarea
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o que foi analisado, principais achados, contexto..."
                rows={4}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Links</label>
                <Button size="sm" variant="outline" onClick={() => addLink(form, setForm)}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar link
                </Button>
              </div>
              <div className="space-y-2">
                {form.links.map((l, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Label (ex: Conversa Claude)" value={l.label} onChange={e => updateLink(form, setForm, i, "label", e.target.value)} className="flex-1" />
                    <Input placeholder="URL" value={l.url} onChange={e => updateLink(form, setForm, i, "url", e.target.value)} className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => removeLink(form, setForm, i)} className="text-red-600 hover:bg-red-50 shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving || !form.descricao.trim()}>
                {saving ? "Salvando…" : "Salvar análise"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sem análises */}
      {analises.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Nenhuma análise registrada ainda.</p>
          <p className="text-sm mt-1">Use o botão acima para adicionar a primeira.</p>
        </div>
      )}

      {/* Timeline agrupada por mês → semana */}
      <div className="space-y-4">
        {agrupado.map(({ mes, semanas }) => (
          <div key={mes} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Cabeçalho do mês */}
            <button
              onClick={() => toggleMes(mes)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-gray-800 text-sm">{labelMes(mes)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{semanas.reduce((acc, s) => acc + s.items.length, 0)} análise{semanas.reduce((acc, s) => acc + s.items.length, 0) !== 1 ? "s" : ""}</span>
                {mesAberto(mes) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {mesAberto(mes) && (
              <div className="divide-y divide-gray-100">
                {semanas.map(({ sem, items }) => {
                  const semKey = `${mes}-${sem}`;
                  return (
                    <div key={sem}>
                      {/* Cabeçalho da semana */}
                      <button
                        onClick={() => toggleSem(semKey)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{labelSemana(sem)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{items.length}</span>
                          {semAberta(semKey) ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                      </button>

                      {/* Cards de análise */}
                      {semAberta(semKey) && (
                        <div className="px-4 pb-3 pt-1 space-y-3">
                          {items.map(a => (
                            <Card key={a.id} className="border border-gray-200 shadow-none">
                              <CardContent className="p-4">
                                {editingId === a.id ? (
                                  /* Modo edição */
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 block mb-1">Data</label>
                                      <Input type="date" value={editForm.dataAnalise} onChange={e => setEditForm(f => ({ ...f, dataAnalise: e.target.value }))} className="w-40 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 block mb-1">Descrição</label>
                                      <Textarea value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} rows={4} className="text-sm" />
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-gray-500">Links</label>
                                        <Button size="sm" variant="outline" onClick={() => addLink(editForm, setEditForm)} className="h-7 text-xs">
                                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {editForm.links.map((l, i) => (
                                          <div key={i} className="flex gap-2 items-center">
                                            <Input placeholder="Label" value={l.label} onChange={e => updateLink(editForm, setEditForm, i, "label", e.target.value)} className="flex-1 text-sm h-8" />
                                            <Input placeholder="URL" value={l.url} onChange={e => updateLink(editForm, setEditForm, i, "url", e.target.value)} className="flex-1 text-sm h-8" />
                                            <Button size="sm" variant="outline" onClick={() => removeLink(editForm, setEditForm, i)} className="text-red-600 hover:bg-red-50 h-8 px-2">
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="outline" onClick={cancelEdit}><X className="w-3 h-3 mr-1" /> Cancelar</Button>
                                      <Button size="sm" onClick={() => handleSave(a.id)}><Check className="w-3 h-3 mr-1" /> Salvar</Button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Modo leitura */
                                  <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <span className="text-xs font-medium text-gray-400">{formatarData(a.dataAnalise)}</span>
                                      <div className="flex gap-1 shrink-0">
                                        <Button size="sm" variant="ghost" onClick={() => startEdit(a)} className="h-7 px-2 text-gray-400 hover:text-gray-700">
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)} className="h-7 px-2 text-gray-400 hover:text-red-600">
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">{a.descricao}</p>
                                    {a.links.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {a.links.map((l, i) => (
                                          <a
                                            key={i}
                                            href={l.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors border border-blue-100"
                                          >
                                            <LinkIcon className="w-3 h-3" />
                                            {l.label || l.url}
                                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
