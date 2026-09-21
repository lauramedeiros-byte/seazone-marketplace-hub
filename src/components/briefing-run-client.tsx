"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { BriefingDoc } from "@/components/briefing-doc";
import { RoteiroCard, ROTULO_FORMATO, type RoteiroCompleto } from "@/components/roteiro-card";
import { parseBloco, normalizarFormato, normalizarStatus, ehSim } from "@/lib/spot-bloco";
import { UploadCloud, ExternalLink, TriangleAlert, Clapperboard, ClipboardCheck, Archive } from "lucide-react";

type Anexo = { id: string; tipo: string; titulo: string | null; url: string };

function dataLonga(iso: string) {
  // geradoEm e data pura, guardada a meia-noite UTC: formatar no fuso local mostrava
  // o dia anterior (21/09 aparecia como 20/09).
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

const FORM_VAZIO = {
  formato: "video-narrado", status: "teste", codigo: "", duracao: "", monica: false,
  estrutura: "", oQueMuda: "", derivadoDe: "", conteudoMd: "", anexos: "",
};

export type { RoteiroCompleto };

export function BriefingRunClient({
  slug, ehMaisRecente, empreendimento, run, roteirosInit,
}: {
  slug: string;
  ehMaisRecente: boolean;
  empreendimento: { nome: string; cidade: string; estado: string };
  run: {
    id: string; geradoEm: string; geradoPor: string | null; origem: string; conteudoMd: string;
    artefatoUrl: string | null; docsUrl: string | null; observacao: string | null; anexos: Anexo[];
  };
  roteirosInit: RoteiroCompleto[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lidos, setLidos] = useState<string[]>([]);
  const [form, setForm] = useState(FORM_VAZIO);

  const bloco = useMemo(() => parseBloco(run.conteudoMd), [run.conteudoMd]);

  // Roteiro excluido continua vindo do banco: some da lista principal e fica no bloco
  // de excluidos, de onde da para restaurar.
  const ativos = roteirosInit.filter((r) => !r.arquivadoEm);
  const arquivados = roteirosInit.filter((r) => r.arquivadoEm);

  /** O bloco colado preenche os campos sozinho — quem colou só confere e clica. */
  function colar(texto: string) {
    const lido = parseBloco(texto);
    if (!lido.temCabecalho) {
      setForm((f) => ({ ...f, conteudoMd: texto }));
      setLidos([]);
      return;
    }
    const c = lido.campos;
    const formato = normalizarFormato(c.formato?.valor);
    const status = normalizarStatus(c.status?.valor);
    const achados: string[] = [];
    if (formato) achados.push(ROTULO_FORMATO[formato]);
    if (status) achados.push(`status ${status}`);
    if (c.codigo?.valor) achados.push(c.codigo.valor);
    if (c.duracao?.valor) achados.push(c.duracao.valor);
    if (c.monica?.valor) achados.push(ehSim(c.monica.valor) ? "com Mônica" : "sem Mônica");
    if (lido.links.length) achados.push(`${lido.links.length} link(s)`);

    setForm((f) => ({
      ...f,
      conteudoMd: texto,
      formato: formato ?? f.formato,
      status: status ?? f.status,
      codigo: c.codigo?.valor ?? "",
      duracao: c.duracao?.valor ?? "",
      monica: c.monica ? ehSim(c.monica.valor) : false,
      estrutura: c.estrutura?.valor ?? "",
      oQueMuda: c.oQueMuda?.valor ?? "",
      derivadoDe: c.derivadoDe?.valor ?? "",
      anexos: lido.links.map((l) => l.url).join("\n"),
    }));
    setLidos(achados);
  }

  async function subir() {
    setSalvando(true);
    setErro(null);
    try {
      const anexos = form.anexos.split("\n").map((l) => l.trim()).filter(Boolean)
        .map((url) => ({ tipo: "link", url }));
      const res = await fetch("/api/spot-roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, briefingRunId: run.id, anexos }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível subir.");
      setAberto(false);
      setForm(FORM_VAZIO);
      setLidos([]);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <BackButton href={`/briefings/${slug}`} label={`Voltar ao ${empreendimento.nome}`} />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">
            {empreendimento.nome} · {empreendimento.cidade} - {empreendimento.estado}
          </p>
          <h1 className="text-2xl font-bold text-sz-navy">Briefing de {dataLonga(run.geradoEm)}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {run.geradoPor ? `Gerado por ${run.geradoPor}` : "Sem autor registrado"}
            {run.origem === "skill" && " · pela skill"} · {ativos.length}{" "}
            {ativos.length === 1 ? "roteiro" : "roteiros"}
            {arquivados.length > 0 && ` · ${arquivados.length} excluído${arquivados.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button size="sm"><UploadCloud className="mr-1.5 h-4 w-4" /> Subir conteúdo</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subir conteúdo deste briefing</DialogTitle>
              <DialogDescription>
                Cole o bloco do roteiro que o Claude entregou — o cabeçalho entre <code>---</code> preenche os campos
                abaixo sozinho. Vale para vídeo narrado, apresentadora e criativo estático.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label htmlFor="sr-conteudo" className="text-xs font-medium text-gray-700">
                  Bloco do roteiro <span className="text-sz-coral">*</span>
                </label>
                <Textarea
                  id="sr-conteudo"
                  rows={10}
                  value={form.conteudoMd}
                  placeholder={"---\ntipo: roteiro\nformato: vídeo narrado\nstatus: teste\n---\n\n| Cena | Lettering | Narração |"}
                  onChange={(e) => colar(e.target.value)}
                  className="font-mono text-[12px]"
                />
                {lidos.length > 0 && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-sz-navy">
                    <ClipboardCheck className="h-3.5 w-3.5 text-sz-azul" />
                    Li do bloco: {lidos.join(" · ")}
                  </p>
                )}
              </div>

              <details className="rounded-lg border border-gray-200 p-3">
                <summary className="cursor-pointer text-xs font-medium text-gray-700">
                  Conferir ou corrigir os campos
                </summary>

                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="sr-formato" className="text-xs font-medium text-gray-700">Formato</label>
                      <select id="sr-formato" value={form.formato}
                        onChange={(e) => setForm({ ...form, formato: e.target.value })}
                        className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm">
                        <option value="video-narrado">Vídeo narrado</option>
                        <option value="video-apresentadora">Vídeo apresentadora</option>
                        <option value="estatico">Criativo estático</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="sr-status" className="text-xs font-medium text-gray-700">Status</label>
                      <select id="sr-status" value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm">
                        <option value="teste">Teste — não foi produzido</option>
                        <option value="aprovado">Aprovado — ainda não produzido</option>
                        <option value="produzido">Produzido — foi para mídia paga</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="sr-codigo" className="text-xs font-medium text-gray-700">Código</label>
                      <Input id="sr-codigo" value={form.codigo} placeholder="automático"
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="sr-duracao" className="text-xs font-medium text-gray-700">Duração</label>
                      <Input id="sr-duracao" value={form.duracao} placeholder="28 a 30s"
                        onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
                    </div>
                    <div className="flex items-end pb-2">
                      <label htmlFor="sr-monica" className="flex items-center gap-2 text-xs font-medium text-gray-700">
                        <input id="sr-monica" type="checkbox" checked={form.monica}
                          onChange={(e) => setForm({ ...form, monica: e.target.checked })} />
                        Com Mônica
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sr-estrutura" className="text-xs font-medium text-gray-700">Tese da peça</label>
                    <Input id="sr-estrutura" value={form.estrutura} placeholder="o que essa peça defende"
                      onChange={(e) => setForm({ ...form, estrutura: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="sr-muda" className="text-xs font-medium text-gray-700">O que muda</label>
                      <Input id="sr-muda" value={form.oQueMuda} placeholder="o que difere dos outros"
                        onChange={(e) => setForm({ ...form, oQueMuda: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="sr-derivado" className="text-xs font-medium text-gray-700">Derivado de</label>
                      <Input id="sr-derivado" value={form.derivadoDe} placeholder="R001"
                        onChange={(e) => setForm({ ...form, derivadoDe: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sr-anexos" className="text-xs font-medium text-gray-700">
                      Imagens, artes ou vídeos <span className="text-gray-400">(links, um por linha)</span>
                    </label>
                    <Textarea id="sr-anexos" rows={2} value={form.anexos}
                      placeholder={"https://drive.google.com/..."}
                      onChange={(e) => setForm({ ...form, anexos: e.target.value })} />
                    <p className="mt-1 text-[11px] text-gray-400">
                      Imagem entra como link — suba no Drive e cole o endereço aqui.
                    </p>
                  </div>
                </div>
              </details>

              {erro && <p className="text-xs text-sz-coral">{erro}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button onClick={subir} disabled={salvando || !form.conteudoMd.trim()}>
                {salvando ? "Subindo..." : "Anexar roteiro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!ehMaisRecente && (
        <Card className="mb-4 border-sz-coral-palido bg-sz-coral-fundo">
          <CardContent className="flex gap-2.5 p-3.5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-sz-coral" />
            <p className="text-xs leading-relaxed text-sz-navy">
              <strong>Este é um briefing antigo.</strong> Os números são o retrato de {dataLonga(run.geradoEm)} — preço,
              cotas disponíveis e fase de obra já mudaram desde então. Serve para entender com que dados os roteiros
              abaixo foram escritos, não para enviar proposta.
            </p>
          </CardContent>
        </Card>
      )}

      {(run.artefatoUrl || run.docsUrl || run.anexos.length > 0 || run.observacao) && (
        <Card className="mb-4">
          <CardContent className="space-y-2 p-3.5">
            {run.observacao && <p className="text-xs italic text-gray-600">{run.observacao}</p>}
            <div className="flex flex-wrap gap-2">
              {run.artefatoUrl && (
                <a href={run.artefatoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-sz-azul underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Artefato
                </a>
              )}
              {run.docsUrl && (
                <a href={run.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-sz-azul underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Google Docs
                </a>
              )}
              {run.anexos.map((a) => (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-sz-azul underline">
                  <ExternalLink className="h-3.5 w-3.5" /> {a.titulo ?? "Link"}
                </a>
              ))}
            </div>
            {run.artefatoUrl && (
              <p className="text-[11px] text-gray-400">
                O artefato pode estar privado na conta de quem gerou. O conteúdo completo está abaixo.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="briefing">
        <TabsList>
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="roteiros">Roteiros ({ativos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="briefing" className="mt-4">
          <BriefingDoc
            bloco={bloco}
            empreendimento={empreendimento}
            dataGeracao={dataLonga(run.geradoEm)}
          />
        </TabsContent>

        <TabsContent value="roteiros" className="mt-4 space-y-3">
          {ativos.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center">
                <Clapperboard className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">Nenhum roteiro nesta pasta</p>
                <p className="mt-1 text-xs text-gray-500">Use &quot;Subir conteúdo&quot; para anexar.</p>
              </CardContent>
            </Card>
          ) : (
            ativos.map((r) => (
              <RoteiroCard key={r.id} roteiro={r} onMudou={() => router.refresh()} />
            ))
          )}

          {arquivados.length > 0 && (
            <details className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-3">
              <summary className="cursor-pointer text-xs font-medium text-gray-600">
                <Archive className="mr-1.5 inline h-3.5 w-3.5" />
                Excluídos ({arquivados.length}) — continuam no banco e dá para restaurar
              </summary>
              <div className="mt-3 space-y-3">
                {arquivados.map((r) => (
                  <RoteiroCard key={r.id} roteiro={r} onMudou={() => router.refresh()} />
                ))}
              </div>
            </details>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
