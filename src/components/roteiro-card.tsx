"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Md } from "@/components/md";
import { parseBloco } from "@/lib/spot-bloco";
import {
  ExternalLink, Pencil, Trash2, MessageSquare, Check, X, Undo2, Send,
} from "lucide-react";

export type ComentarioRoteiro = {
  id: string;
  autor: string | null;
  texto: string;
  resolvido: boolean;
  criadoEm: string;
};

export type RoteiroCompleto = {
  id: string;
  codigo: string;
  formato: string;
  status: string;
  duracao: string | null;
  monica: boolean;
  estrutura: string | null;
  oQueMuda: string | null;
  derivadoDe: string | null;
  conteudoMd: string;
  criadoEm: string;
  atualizadoEm: string;
  arquivadoEm: string | null;
  arquivadoPor: string | null;
  anexos: { id: string; tipo: string; titulo: string | null; url: string }[];
  comentarios: ComentarioRoteiro[];
};

export const ROTULO_FORMATO: Record<string, string> = {
  "video-narrado": "Vídeo narrado",
  "video-apresentadora": "Vídeo apresentadora",
  estatico: "Criativo estático",
};

/** Sem verde e sem âmbar — é regra do brandbook. Atenção é coral, aprovado é azul. */
const CLASSE_STATUS: Record<string, string> = {
  teste: "bg-sz-coral text-white",
  produzido: "bg-sz-azul text-white",
  aprovado: "bg-sz-azul-palido text-sz-navy-escuro",
};

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function foiEditado(r: RoteiroCompleto) {
  return new Date(r.atualizadoEm).getTime() - new Date(r.criadoEm).getTime() > 60_000;
}

export function RoteiroCard({
  roteiro: r,
  onMudou,
}: {
  roteiro: RoteiroCompleto;
  onMudou: () => void;
}) {
  const { user } = useUser();
  const eu = user?.fullName || user?.firstName || null;

  const bloco = useMemo(() => parseBloco(r.conteudoMd), [r.conteudoMd]);
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novoComentario, setNovoComentario] = useState("");
  const [form, setForm] = useState({
    formato: r.formato,
    status: r.status,
    codigo: r.codigo,
    duracao: r.duracao ?? "",
    monica: r.monica,
    estrutura: r.estrutura ?? "",
    oQueMuda: r.oQueMuda ?? "",
    derivadoDe: r.derivadoDe ?? "",
    conteudoMd: r.conteudoMd,
  });

  const arquivado = Boolean(r.arquivadoEm);
  const abertos = r.comentarios.filter((c) => !c.resolvido);

  /** Anexo e link do cabeçalho podem ser o mesmo endereço — mostra uma vez só. */
  const links = Object.values(
    Object.fromEntries(
      [...bloco.links, ...r.anexos.map((a) => ({ url: a.url, titulo: a.titulo ?? "Peça" }))].map(
        (l) => [l.url, l]
      )
    )
  );

  async function chamar(entrada: string, init: RequestInit) {
    setOcupado(true);
    setErro(null);
    try {
      const res = await fetch(entrada, init);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Não deu certo.");
      onMudou();
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  const json = (corpo: unknown, metodo: "POST" | "PATCH") => ({
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

  async function salvarEdicao() {
    if (await chamar(`/api/spot-roteiros/${r.id}`, json(form, "PATCH"))) setEditando(false);
  }

  async function excluir() {
    const por = eu ? `?por=${encodeURIComponent(eu)}` : "";
    if (await chamar(`/api/spot-roteiros/${r.id}${por}`, { method: "DELETE" })) setConfirmando(false);
  }

  async function comentar() {
    const texto = novoComentario.trim();
    if (!texto) return;
    if (await chamar("/api/spot-comentarios", json({ roteiroId: r.id, texto, autor: eu }, "POST"))) {
      setNovoComentario("");
    }
  }

  return (
    <Card className={arquivado ? "border-dashed bg-gray-50/70" : undefined}>
      <CardContent className="p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-sz-navy">
            {r.codigo} — {ROTULO_FORMATO[r.formato] ?? r.formato}
          </h3>

          <div className="flex items-center gap-1.5">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                CLASSE_STATUS[r.status] ?? "bg-gray-200 text-gray-700"
              }`}
            >
              {r.status}
            </span>

            {arquivado ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-[11px] text-sz-azul"
                disabled={ocupado}
                onClick={() => chamar(`/api/spot-roteiros/${r.id}`, json({ restaurar: true }, "PATCH"))}
              >
                <Undo2 className="h-3.5 w-3.5" /> Restaurar
              </Button>
            ) : (
              <>
                <button
                  type="button"
                  aria-label={`Editar ${r.codigo}`}
                  title="Editar roteiro"
                  onClick={() => setEditando(true)}
                  className="rounded p-1 text-gray-400 hover:bg-sz-azul-palido hover:text-sz-azul"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${r.codigo}`}
                  title="Excluir roteiro"
                  onClick={() => setConfirmando(true)}
                  className="rounded p-1 text-gray-400 hover:bg-sz-coral-fundo hover:text-sz-coral"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {arquivado && (
          <p className="mb-3 rounded-lg border border-dashed border-gray-300 bg-white p-2.5 text-[11.5px] text-gray-600">
            <strong className="text-gray-800">Excluído</strong> em {dataCurta(r.arquivadoEm!)}
            {r.arquivadoPor && ` por ${r.arquivadoPor}`}. Continua salvo no banco, com os comentários — some
            da lista, não da história.
          </p>
        )}

        {confirmando && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-sz-coral-palido bg-sz-coral-fundo p-2.5">
            <p className="text-[11.5px] text-sz-navy">
              Excluir o <strong>{r.codigo}</strong>? Ele sai da lista e fica guardado, dá para restaurar depois.
            </p>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
              <Button size="sm" className="h-7 bg-sz-coral text-[11px] hover:bg-sz-coral-claro" disabled={ocupado} onClick={excluir}>
                {ocupado ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {r.duracao && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{r.duracao}</span>
          )}
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
            {r.monica ? "com Mônica" : "sem Mônica"}
          </span>
          {r.derivadoDe && (
            <span className="rounded bg-sz-azul-palido px-2 py-0.5 text-[11px] text-sz-navy-escuro">
              derivado de {r.derivadoDe}
            </span>
          )}
          {foiEditado(r) && (
            <span className="text-[11px] text-gray-400">editado em {dataCurta(r.atualizadoEm)}</span>
          )}
        </div>

        {!arquivado && r.status === "teste" && (
          <p className="mb-3 rounded-lg border border-sz-coral-palido bg-sz-coral-fundo p-2.5 text-xs leading-relaxed text-sz-navy">
            <strong>Esta peça não foi produzida.</strong> O texto vale de referência, mas nunca foi ao ar — não há
            resultado por trás dele e não serve como prova do que converte.
          </p>
        )}

        {r.estrutura && (
          <p className="mb-1 text-xs text-gray-600">
            <strong className="text-sz-navy">Tese:</strong> {r.estrutura}
          </p>
        )}
        {r.oQueMuda && (
          <p className="mb-3 text-xs text-gray-600">
            <strong className="text-sz-navy">O que muda:</strong> {r.oQueMuda}
          </p>
        )}

        <Md>{bloco.corpo}</Md>

        {links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
            {links.map((a) => (
              <a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-sz-azul underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {a.titulo}
              </a>
            ))}
          </div>
        )}

        {/* Comentários */}
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <MessageSquare className="h-3.5 w-3.5" />
            Comentários
            {r.comentarios.length > 0 && (
              <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-600">
                {abertos.length > 0 ? `${abertos.length} em aberto` : "todos resolvidos"}
              </span>
            )}
          </p>

          {r.comentarios.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {r.comentarios.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-start gap-2 rounded-lg border p-2.5 ${
                    c.resolvido ? "border-gray-200 bg-gray-50" : "border-sz-azul/15 bg-sz-azul-palido/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[12.5px] leading-relaxed ${
                        c.resolvido ? "text-gray-400 line-through" : "text-gray-700"
                      }`}
                    >
                      {c.texto}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-gray-400">
                      {c.autor ?? "sem autor"} · {dataCurta(c.criadoEm)}
                      {c.resolvido && " · resolvido"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={c.resolvido ? "Reabrir comentário" : "Marcar como resolvido"}
                    title={c.resolvido ? "Reabrir" : "Marcar como resolvido"}
                    disabled={ocupado}
                    onClick={() =>
                      chamar(`/api/spot-comentarios/${c.id}`, json({ resolvido: !c.resolvido }, "PATCH"))
                    }
                    className="rounded p-1 text-gray-400 hover:bg-white hover:text-sz-azul"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir comentário"
                    title="Excluir comentário"
                    disabled={ocupado}
                    onClick={() => chamar(`/api/spot-comentarios/${c.id}`, { method: "DELETE" })}
                    className="rounded p-1 text-gray-400 hover:bg-sz-coral-fundo hover:text-sz-coral"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Input
              value={novoComentario}
              placeholder={`o que ajustar no ${r.codigo}`}
              className="h-8 text-[12.5px]"
              onChange={(e) => setNovoComentario(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  comentar();
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0 gap-1 text-[11px]"
              disabled={ocupado || !novoComentario.trim()}
              onClick={comentar}
            >
              <Send className="h-3.5 w-3.5" /> Comentar
            </Button>
          </div>
        </div>

        {erro && <p className="mt-2 text-xs text-sz-coral">{erro}</p>}
      </CardContent>

      {/* Edição */}
      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {r.codigo}</DialogTitle>
            <DialogDescription>
              O que você salvar aqui substitui o roteiro, e os comentários continuam do lado para conferir.
            </DialogDescription>
          </DialogHeader>

          {abertos.length > 0 && (
            <div className="rounded-lg border border-sz-azul/15 bg-sz-azul-palido/50 p-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sz-navy-escuro">
                A ajustar ({abertos.length})
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-[12px] text-gray-700">
                {abertos.map((c) => (
                  <li key={c.id}>
                    {c.texto}
                    {c.autor && <span className="text-gray-400"> — {c.autor}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`ed-formato-${r.id}`} className="text-xs font-medium text-gray-700">Formato</label>
                <select
                  id={`ed-formato-${r.id}`}
                  value={form.formato}
                  onChange={(e) => setForm({ ...form, formato: e.target.value })}
                  className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="video-narrado">Vídeo narrado</option>
                  <option value="video-apresentadora">Vídeo apresentadora</option>
                  <option value="estatico">Criativo estático</option>
                </select>
              </div>
              <div>
                <label htmlFor={`ed-status-${r.id}`} className="text-xs font-medium text-gray-700">Status</label>
                <select
                  id={`ed-status-${r.id}`}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="teste">Teste — não foi produzido</option>
                  <option value="aprovado">Aprovado — ainda não produzido</option>
                  <option value="produzido">Produzido — foi para mídia paga</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor={`ed-codigo-${r.id}`} className="text-xs font-medium text-gray-700">Código</label>
                <Input id={`ed-codigo-${r.id}`} value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`ed-duracao-${r.id}`} className="text-xs font-medium text-gray-700">Duração</label>
                <Input id={`ed-duracao-${r.id}`} value={form.duracao} placeholder="28 a 30s"
                  onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
              </div>
              <div className="flex items-end pb-2">
                <label htmlFor={`ed-monica-${r.id}`} className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input id={`ed-monica-${r.id}`} type="checkbox" checked={form.monica}
                    onChange={(e) => setForm({ ...form, monica: e.target.checked })} />
                  Com Mônica
                </label>
              </div>
            </div>

            <div>
              <label htmlFor={`ed-tese-${r.id}`} className="text-xs font-medium text-gray-700">Tese da peça</label>
              <Input id={`ed-tese-${r.id}`} value={form.estrutura}
                onChange={(e) => setForm({ ...form, estrutura: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`ed-muda-${r.id}`} className="text-xs font-medium text-gray-700">O que muda</label>
                <Input id={`ed-muda-${r.id}`} value={form.oQueMuda}
                  onChange={(e) => setForm({ ...form, oQueMuda: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`ed-deriv-${r.id}`} className="text-xs font-medium text-gray-700">Derivado de</label>
                <Input id={`ed-deriv-${r.id}`} value={form.derivadoDe} placeholder="R001"
                  onChange={(e) => setForm({ ...form, derivadoDe: e.target.value })} />
              </div>
            </div>

            <div>
              <label htmlFor={`ed-conteudo-${r.id}`} className="text-xs font-medium text-gray-700">
                Conteúdo do roteiro
              </label>
              <Textarea
                id={`ed-conteudo-${r.id}`}
                rows={12}
                value={form.conteudoMd}
                className="font-mono text-[12px]"
                onChange={(e) => setForm({ ...form, conteudoMd: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Pode manter o cabeçalho entre <code>---</code>: o que estiver nele é relido ao salvar.
              </p>
            </div>

            {erro && <p className="text-xs text-sz-coral">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={ocupado || !form.conteudoMd.trim()}>
              {ocupado ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
