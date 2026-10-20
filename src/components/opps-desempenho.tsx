"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Info, ChevronDown, ChevronRight } from "lucide-react";
import { DIAS_VENDA, porMil, type Desempenho, type OppComResultado, type Venda } from "@/lib/opps-desempenho";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmt1 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const mil = (v: number | null) => (v === null ? "—" : `R$ ${Math.round(v / 1000)} mil`);

const VENDA: Record<Venda, { rotulo: (o: OppComResultado) => string; cls: string }> = {
  vendida: { rotulo: (o) => `Vendida ${dm(o.vendaEm!)}`, cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  reservada: { rotulo: (o) => `Em negociação ${dm(o.vendaEm!)}`, cls: "bg-amber-100 text-amber-800 border-amber-200" },
  "vendida-antes": { rotulo: (o) => `Constava vendida em ${dm(o.vendaEm!)}, antes da opp`, cls: "bg-gray-100 text-gray-500 border-gray-200" },
  disponivel: { rotulo: () => "Segue disponível", cls: "bg-white text-gray-500 border-gray-200" },
  "sem-dado": { rotulo: () => "—", cls: "bg-white text-gray-400 border-gray-200" },
};

function VendaBadge({ o }: { o: OppComResultado }) {
  const v = VENDA[o.venda];
  return <span className={`inline-block text-[11px] font-medium border rounded px-1.5 py-0.5 whitespace-nowrap ${v.cls}`}>{v.rotulo(o)}</span>;
}

function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">{rotulo}</p>
      <p className="text-xl font-bold text-gray-900 tabular-nums">{valor}</p>
      {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

function nomeCota(o: OppComResultado) {
  return (
    <span className="text-[13px] text-gray-800">
      {o.nome}
      {o.cota && <span className="ml-1.5 font-mono text-[10.5px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">{o.cota}</span>}
    </span>
  );
}

function toques(o: OppComResultado) {
  if (o.dono === "monica") return <span className="text-[11px] text-gray-400">comunidade da Mônica — sem disparo</span>;
  if (!o.campanhas.length) {
    return (
      <span className="text-[11px] text-gray-400">
        {o.publicacao < "2026-08-01" ? "saiu pela MIA (sem dados no motor)" : "nenhuma campanha encontrada"}
      </span>
    );
  }
  return (
    <div className="space-y-0.5">
      {o.campanhas.map((c) => (
        <p key={c.campanha} className="text-[11px] text-gray-600 tabular-nums" title={c.campanha}>
          <span className="font-semibold text-gray-700">{c.toque}</span> {dm(c.dataCamp)} · {fmt(c.envios)} env · {c.levantadas} lev · {c.reuniao} reun
        </p>
      ))}
    </div>
  );
}

export function OppsDesempenho({ data, atualizadoEm }: { data: Desempenho | null; atualizadoEm: string | null }) {
  const [verSemOpp, setVerSemOpp] = useState(false);

  if (!data || data.total.campanhas === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-gray-500">
          Ainda não há dados de desempenho. O sync roda todo dia de manhã (cron <code>/api/cron/sync-opps-desempenho</code>).
        </CardContent>
      </Card>
    );
  }

  const { total, porToque, porFaixa, ranking, vendidas, opps, semOpp } = data;
  const semanas = [...new Set(opps.map((o) => o.publicacao))];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[12px] text-sky-900">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          Atualiza sozinha todo dia{atualizadoEm ? ` (última: ${atualizadoEm})` : ""}. Disparos do motor (SIA) desde 01/08/2026 — antes
          as opps saíam pela MIA, que não tem dado aqui. <b>Levantada</b> = clique positivo sem botão de saída (é piso).{" "}
          <b>Reunião</b> = Reunião Realizada a Reserva depois do envio. <b>Venda</b> = a cota ofertada aparece como vendida no
          marketplace em até {DIAS_VENDA} dias da semana da opp — é sinal, não atribuição (a data do Nekt nem sempre é o dia exato da venda).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Kpi rotulo="Envios" valor={fmt(total.envios)} sub={`${total.campanhas} campanhas`} />
        <Kpi rotulo="Levantadas" valor={fmt(total.levantadas)} sub={`${fmt1(total.levMil)} por mil`} />
        <Kpi rotulo="Reuniões" valor={fmt(total.reuniao)} sub={`${fmt2(total.reunMil)} por mil`} />
        <Kpi rotulo="Contrato" valor={fmt(total.contrato)} sub="lead do disparo que chegou a Contrato" />
        <Kpi rotulo={`Vendidas em ${DIAS_VENDA} dias`} valor={fmt(vendidas.length)} sub="cotas de opp (mkt + Mônica)" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Melhores opps</CardTitle>
          <p className="text-xs text-gray-500">Opps de marketing com 300+ envios, por reunião por mil envios (levantada desempata).</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-gray-400 border-b">
                  <th className="py-1.5 pr-2">#</th><th className="pr-2">Opp</th><th className="pr-2">Semana</th><th className="pr-2">Preço</th>
                  <th className="pr-2 text-right">Envios</th><th className="pr-2 text-right">Lev/mil</th><th className="pr-2 text-right">Reuniões</th>
                  <th className="pr-2 text-right">Reun/mil</th><th>Venda</th>
                </tr>
              </thead>
              <tbody>
                {ranking.slice(0, 10).map((o, i) => (
                  <tr key={o.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 pr-2 text-gray-400">{i + 1}</td>
                    <td className="pr-2">{nomeCota(o)}</td>
                    <td className="pr-2 text-gray-500">{dm(o.publicacao)}</td>
                    <td className="pr-2 text-gray-600 whitespace-nowrap">{mil(o.preco)}</td>
                    <td className="pr-2 text-right tabular-nums">{fmt(o.envios)}</td>
                    <td className="pr-2 text-right tabular-nums">{fmt1(porMil(o.levantadas, o.envios))}</td>
                    <td className="pr-2 text-right tabular-nums">{o.reuniao}</td>
                    <td className="pr-2 text-right tabular-nums font-semibold">{fmt2(porMil(o.reuniao, o.envios))}</td>
                    <td><VendaBadge o={o} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-600" /> Por faixa de preço</CardTitle>
            <p className="text-xs text-gray-500">Opps de marketing com disparo no motor.</p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-gray-400 border-b">
                  <th className="py-1.5 pr-2">Faixa</th><th className="pr-2 text-right">Opps</th><th className="pr-2 text-right">Envios</th>
                  <th className="pr-2 text-right">Lev/mil</th><th className="pr-2 text-right">Reuniões</th><th className="text-right">Reun/mil</th>
                </tr>
              </thead>
              <tbody>
                {porFaixa.map((f) => (
                  <tr key={f.faixa} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 pr-2">{f.faixa}</td>
                    <td className="pr-2 text-right tabular-nums">{f.opps}</td>
                    <td className="pr-2 text-right tabular-nums">{fmt(f.envios)}</td>
                    <td className="pr-2 text-right tabular-nums">{f.envios ? fmt1(f.levMil) : "—"}</td>
                    <td className="pr-2 text-right tabular-nums">{f.reuniao}</td>
                    <td className="text-right tabular-nums font-semibold">{f.envios ? fmt2(f.reunMil) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">1º toque x 2º toque</CardTitle>
            <p className="text-xs text-gray-500">O 2º toque vai só para quem não levantou a mão no 1º.</p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-gray-400 border-b">
                  <th className="py-1.5 pr-2">Toque</th><th className="pr-2 text-right">Campanhas</th><th className="pr-2 text-right">Envios</th>
                  <th className="pr-2 text-right">Lev/mil</th><th className="pr-2 text-right">Reuniões</th><th className="text-right">Reun/mil</th>
                </tr>
              </thead>
              <tbody>
                {porToque.map((t) => (
                  <tr key={t.toque} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 pr-2 font-semibold">{t.toque}</td>
                    <td className="pr-2 text-right tabular-nums">{t.campanhas}</td>
                    <td className="pr-2 text-right tabular-nums">{fmt(t.envios)}</td>
                    <td className="pr-2 text-right tabular-nums">{fmt1(t.levMil)}</td>
                    <td className="pr-2 text-right tabular-nums">{t.reuniao}</td>
                    <td className="text-right tabular-nums font-semibold">{fmt2(t.reunMil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Todas as opps, semana a semana</CardTitle>
          <p className="text-xs text-gray-500">Semana = segunda em que a opp foi ao ar.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {semanas.map((s) => (
            <div key={s} className="rounded-lg border border-gray-200">
              <p className="px-3 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Semana de {dm(s)}</p>
              <div className="divide-y divide-gray-100">
                {opps.filter((o) => o.publicacao === s).map((o) => (
                  <div key={o.id} className="px-3 py-2 grid grid-cols-1 md:grid-cols-[1.4fr_0.6fr_1.8fr_auto] gap-1 md:gap-3 items-start">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className={o.dono === "monica" ? "border-purple-200 text-purple-700" : "border-teal-200 text-teal-700"}>
                        {o.dono === "monica" ? "Mônica" : "mkt"}
                      </Badge>
                      {nomeCota(o)}
                    </div>
                    <span className="text-[12px] text-gray-600">{mil(o.preco)}</span>
                    {toques(o)}
                    <VendaBadge o={o} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {semOpp.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <button onClick={() => setVerSemOpp((v) => !v)} className="flex items-center gap-1.5 text-left">
              {verSemOpp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <CardTitle className="text-base">Campanhas de opp sem opp registrada ({semOpp.length})</CardTitle>
            </button>
            <p className="text-xs text-gray-500 ml-5">Saíram com nome de opp da semana, mas não há opp de marketing do mesmo SPOT naquela semana no registro. Entram no total acima.</p>
          </CardHeader>
          {verSemOpp && (
            <CardContent>
              <div className="space-y-0.5">
                {semOpp.map((c) => (
                  <p key={c.campanha} className="text-[11.5px] text-gray-600 tabular-nums break-all">
                    {dm(c.dataCamp)} · <span className="font-mono">{c.campanha}</span> · {fmt(c.envios)} env · {c.levantadas} lev · {c.reuniao} reun
                  </p>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
