"use client";

import { useState, useRef, useCallback } from "react";
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
  FolderPlus,
  Folder,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  ImagePlus,
  ChevronDown,
  ChevronRight,
  Link2,
  X,
  Loader2,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────
type Registro = {
  id: string;
  pastaId: string;
  titulo: string | null;
  links: unknown; // string[]
  imagem: string | null;
  idAnuncio: string | null;
  valorInvestido: number | null;
  mql: number | null;
  sql: number | null;
  opp: number | null;
  won: number | null;
  custoPorWon: number | null;
};

type Pasta = {
  id: string;
  nome: string;
  registros: Registro[];
};

type RegistroForm = {
  titulo: string;
  links: string[];
  imagem: string | null;
  idAnuncio: string;
  valorInvestido: string;
  mql: string;
  sql: string;
  opp: string;
  won: string;
  custoPorWon: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────
async function api(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch("/api/criativos-passado", {
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

function asLinks(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

function fmtMoeda(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("pt-BR");
}

// Comprime a imagem no navegador antes de virar base64 (evita estourar o banco)
function fileToCompressedDataURL(file: File, maxDim = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponível"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM: RegistroForm = {
  titulo: "",
  links: [""],
  imagem: null,
  idAnuncio: "",
  valorInvestido: "",
  mql: "",
  sql: "",
  opp: "",
  won: "",
  custoPorWon: "",
};

// ── Componente principal ───────────────────────────────────────────────────
export function CriativosPassadoClient({ pastasInit }: { pastasInit: Pasta[] }) {
  const router = useRouter();
  const [pastas, setPastas] = useState<Pasta[]>(pastasInit);
  const [abertas, setAbertas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(pastasInit.map((p) => [p.id, true]))
  );
  const [salvandoPasta, setSalvandoPasta] = useState(false);

  // Dialog de registro
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<{ pastaId: string; registroId: string | null } | null>(
    null
  );
  const [form, setForm] = useState<RegistroForm>(EMPTY_FORM);
  const [salvandoReg, setSalvandoReg] = useState(false);
  const [comprimindo, setComprimindo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  // ── Pastas ──
  async function criarPasta() {
    const nome = window.prompt("Nome do empreendimento:");
    if (nome === null) return;
    setSalvandoPasta(true);
    try {
      const { pasta } = await api("create-pasta", { nome });
      setPastas((prev) => [...prev, { ...pasta, registros: [] }]);
      setAbertas((prev) => ({ ...prev, [pasta.id]: true }));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSalvandoPasta(false);
    }
  }

  async function renomearPasta(pasta: Pasta) {
    const nome = window.prompt("Renomear empreendimento:", pasta.nome);
    if (nome === null || nome.trim() === "" || nome === pasta.nome) return;
    try {
      await api("update-pasta", { id: pasta.id, nome });
      setPastas((prev) => prev.map((p) => (p.id === pasta.id ? { ...p, nome: nome.trim() } : p)));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function excluirPasta(pasta: Pasta) {
    if (
      !window.confirm(
        `Excluir a pasta "${pasta.nome}" e todos os ${pasta.registros.length} criativo(s) dentro dela?`
      )
    )
      return;
    try {
      await api("delete-pasta", { id: pasta.id });
      setPastas((prev) => prev.filter((p) => p.id !== pasta.id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // ── Registro (dialog) ──
  function abrirNovoRegistro(pastaId: string) {
    setEditando({ pastaId, registroId: null });
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function abrirEditarRegistro(pastaId: string, r: Registro) {
    setEditando({ pastaId, registroId: r.id });
    const links = asLinks(r.links);
    setForm({
      titulo: r.titulo ?? "",
      links: links.length ? links : [""],
      imagem: r.imagem,
      idAnuncio: r.idAnuncio ?? "",
      valorInvestido: r.valorInvestido != null ? String(r.valorInvestido) : "",
      mql: r.mql != null ? String(r.mql) : "",
      sql: r.sql != null ? String(r.sql) : "",
      opp: r.opp != null ? String(r.opp) : "",
      won: r.won != null ? String(r.won) : "",
      custoPorWon: r.custoPorWon != null ? String(r.custoPorWon) : "",
    });
    setDialogOpen(true);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprimindo(true);
    try {
      const dataURL = await fileToCompressedDataURL(file);
      setForm((f) => ({ ...f, imagem: dataURL }));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setComprimindo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function salvarRegistro() {
    if (!editando) return;
    setSalvandoReg(true);
    try {
      const payload = {
        titulo: form.titulo,
        links: form.links.map((l) => l.trim()).filter(Boolean),
        imagem: form.imagem,
        idAnuncio: form.idAnuncio,
        valorInvestido: form.valorInvestido,
        mql: form.mql,
        sql: form.sql,
        opp: form.opp,
        won: form.won,
        custoPorWon: form.custoPorWon,
      };
      if (editando.registroId) {
        const { registro } = await api("update-registro", { id: editando.registroId, ...payload });
        setPastas((prev) =>
          prev.map((p) =>
            p.id === editando.pastaId
              ? { ...p, registros: p.registros.map((r) => (r.id === registro.id ? registro : r)) }
              : p
          )
        );
      } else {
        const { registro } = await api("create-registro", {
          pastaId: editando.pastaId,
          ...payload,
        });
        setPastas((prev) =>
          prev.map((p) =>
            p.id === editando.pastaId ? { ...p, registros: [...p.registros, registro] } : p
          )
        );
      }
      setDialogOpen(false);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSalvandoReg(false);
    }
  }

  async function excluirRegistro(pastaId: string, r: Registro) {
    if (!window.confirm("Excluir este criativo?")) return;
    try {
      await api("delete-registro", { id: r.id });
      setPastas((prev) =>
        prev.map((p) =>
          p.id === pastaId ? { ...p, registros: p.registros.filter((x) => x.id !== r.id) } : p
        )
      );
    } catch (e) {
      alert((e as Error).message);
    }
  }

  function setLink(i: number, value: string) {
    setForm((f) => ({ ...f, links: f.links.map((l, idx) => (idx === i ? value : l)) }));
  }
  function addLink() {
    setForm((f) => ({ ...f, links: [...f.links, ""] }));
  }
  function removeLink(i: number) {
    setForm((f) => ({ ...f, links: f.links.filter((_, idx) => idx !== i) || [""] }));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton href="/artefatos-de-consulta" label="Voltar aos artefatos" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Criativos que funcionaram no passado
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Aqui você encontra o criativo + o resultado que ele trouxe no passado, para ajudar a
            criar novas artes.
          </p>
        </div>
        <Button onClick={criarPasta} disabled={salvandoPasta} className="gap-2 shrink-0">
          <FolderPlus className="w-4 h-4" />
          Nova pasta
        </Button>
      </div>

      {pastas.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <Folder className="w-8 h-8 mx-auto mb-2 opacity-60" />
          <p className="mb-4">Nenhuma pasta ainda. Crie uma pasta por empreendimento.</p>
          <Button variant="outline" onClick={criarPasta} className="gap-2">
            <FolderPlus className="w-4 h-4" />
            Criar primeira pasta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {pastas.map((pasta) => {
            const aberta = abertas[pasta.id] ?? true;
            return (
              <div key={pasta.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* Cabeçalho da pasta */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                  <button
                    onClick={() => setAbertas((prev) => ({ ...prev, [pasta.id]: !aberta }))}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {aberta ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <Folder className="w-4 h-4 text-violet-500 shrink-0" />
                    <span className="font-semibold text-gray-800 truncate">{pasta.nome}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {pasta.registros.length}{" "}
                      {pasta.registros.length === 1 ? "criativo" : "criativos"}
                    </span>
                  </button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => renomearPasta(pasta)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => excluirPasta(pasta)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Conteúdo da pasta */}
                {aberta && (
                  <div className="p-4">
                    {pasta.registros.length === 0 ? (
                      <p className="text-sm text-gray-400 mb-3">Nenhum criativo cadastrado ainda.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {pasta.registros.map((r) => (
                          <RegistroCard
                            key={r.id}
                            registro={r}
                            onEdit={() => abrirEditarRegistro(pasta.id, r)}
                            onDelete={() => excluirRegistro(pasta.id, r)}
                          />
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => abrirNovoRegistro(pasta.id)}
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar criativo
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de criar/editar registro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando?.registroId ? "Editar criativo" : "Novo criativo"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Título */}
            <Campo label="Título (opcional)">
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Estático piscina — abril"
              />
            </Campo>

            {/* Imagem */}
            <Campo label="Imagem do criativo (opcional)">
              {form.imagem ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imagem}
                    alt="Criativo"
                    className="max-h-48 rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, imagem: null }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"
                    title="Remover imagem"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={comprimindo}
                  onClick={() => fileRef.current?.click()}
                >
                  {comprimindo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  {comprimindo ? "Processando..." : "Subir imagem do notebook"}
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
            </Campo>

            {/* Links */}
            <Campo label="Links do criativo (pode adicionar vários)">
              <div className="space-y-2">
                {form.links.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <Input
                      value={l}
                      onChange={(e) => setLink(i, e.target.value)}
                      placeholder="https://..."
                    />
                    {form.links.length > 1 && (
                      <button
                        onClick={() => removeLink(i)}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                        title="Remover link"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={addLink}>
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar link
                </Button>
              </div>
            </Campo>

            {/* Resultados */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Resultados
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Valor investido (R$)">
                  <Input
                    inputMode="decimal"
                    value={form.valorInvestido}
                    onChange={(e) => setForm((f) => ({ ...f, valorInvestido: e.target.value }))}
                    placeholder="0,00"
                  />
                </Campo>
                <Campo label="Custo por WON (R$)">
                  <Input
                    inputMode="decimal"
                    value={form.custoPorWon}
                    onChange={(e) => setForm((f) => ({ ...f, custoPorWon: e.target.value }))}
                    placeholder="0,00"
                  />
                </Campo>
                <Campo label="MQL">
                  <Input
                    inputMode="numeric"
                    value={form.mql}
                    onChange={(e) => setForm((f) => ({ ...f, mql: e.target.value }))}
                    placeholder="0"
                  />
                </Campo>
                <Campo label="SQL">
                  <Input
                    inputMode="numeric"
                    value={form.sql}
                    onChange={(e) => setForm((f) => ({ ...f, sql: e.target.value }))}
                    placeholder="0"
                  />
                </Campo>
                <Campo label="OPP">
                  <Input
                    inputMode="numeric"
                    value={form.opp}
                    onChange={(e) => setForm((f) => ({ ...f, opp: e.target.value }))}
                    placeholder="0"
                  />
                </Campo>
                <Campo label="WON">
                  <Input
                    inputMode="numeric"
                    value={form.won}
                    onChange={(e) => setForm((f) => ({ ...f, won: e.target.value }))}
                    placeholder="0"
                  />
                </Campo>
              </div>
            </div>

            {/* ID do anúncio */}
            <Campo label="ID do anúncio">
              <Input
                value={form.idAnuncio}
                onChange={(e) => setForm((f) => ({ ...f, idAnuncio: e.target.value }))}
                placeholder="Ex: 1203948573..."
              />
            </Campo>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={salvandoReg}>
              Cancelar
            </Button>
            <Button onClick={salvarRegistro} disabled={salvandoReg || comprimindo} className="gap-2">
              {salvandoReg && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Card de um criativo ────────────────────────────────────────────────────
function RegistroCard({
  registro: r,
  onEdit,
  onDelete,
}: {
  registro: Registro;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const links = asLinks(r.links);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
      {r.imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.imagem} alt={r.titulo ?? "Criativo"} className="w-full h-40 object-cover bg-gray-50" />
      ) : (
        <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300">
          <ImagePlus className="w-8 h-8" />
        </div>
      )}

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-sm text-gray-800 min-w-0 break-words">
            {r.titulo || "Criativo"}
          </p>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="text-gray-400 hover:text-blue-600" title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="text-gray-400 hover:text-red-500" title="Excluir">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {links.length > 0 && (
          <div className="flex flex-col gap-1 mb-2">
            {links.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 mt-auto pt-2 text-center">
          <Metric label="Investido" value={fmtMoeda(r.valorInvestido)} />
          <Metric label="MQL" value={fmtNum(r.mql)} />
          <Metric label="SQL" value={fmtNum(r.sql)} />
          <Metric label="OPP" value={fmtNum(r.opp)} />
          <Metric label="WON" value={fmtNum(r.won)} />
          <Metric label="Custo/WON" value={fmtMoeda(r.custoPorWon)} />
        </div>

        {r.idAnuncio && (
          <p className="text-[11px] text-gray-400 mt-2 truncate">
            ID do anúncio: <span className="font-mono text-gray-500">{r.idAnuncio}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 px-1.5 py-1">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-tight">{label}</p>
      <p className="text-xs font-semibold text-gray-700 leading-tight break-words">{value}</p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
