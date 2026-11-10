import { test } from "node:test";
import assert from "node:assert/strict";
import { statusDeVenda, toqueDaCampanha, type CotaStatus } from "@/lib/opps-desempenho";

test("toque: reconhece T2 no nome (2º toque do Natal de 29/10/2026)", () => {
  assert.equal(toqueDaCampanha("2026_10_29_SIA_MKT_PROMO_OPP1_SEMANA_T2_MKTPL_NATAL_SPOT_CAMPAIGN"), "2T");
});

test("toque: formatos que já funcionavam continuam iguais", () => {
  const segundo = [
    "2026_08_20_SIA_MKT_PROMO_OPORTUNIDADE_DA_SEMANA_2T_MKTPL_SANTINHO_SPOT_CAMPAIGN",
    "2026_09_03_SIA_MKT_PROMO_OPP_DA_SEMANA_2TOQUE_MKTPL_JURERE_SPOT_II_CAMPAIGN",
    "2026_09_04_SIA_MKT_PROMO_OPP_DA_SEMANA_2_TOQUE_MKTPL_BARRA_GRANDE_SPOT_CAMPAIGN",
    "2026_09_11_SIA_MKT_PROMO_OPP_DA_SEMANA_2T_MKTPL_NATAL_SPOT_CAMPAIGN_",
    "2026_10_08_SIA_MKT_PROMO_OPP_1_SEMANA_2T_V1_MKTPL_PONTA_DAS_CANAS_SPOT_CAMPAIGN",
  ];
  const primeiro = [
    "2026_10_26_SIA_MKT_PROMO_OPP1_SEMANA_1T_MKTPL_NATAL_SPOT_CAMPAIGN",
    "2026_09_01_SIA_MKT_PROMO_OPP_2_DA_SEMANA_1T_MKTPL_BARRA_GRANDE_SPOT_CAMPAIGN",
    "2026_09_29_SIA_MKT_PROMO_OPP_2_SEMANA_MKTPL_URUBICI_SPOT_II_CAMPAIGN",
    "2026_11_02_SIA_MKT_PROMO_OPP1_SEMANA_MKTPL_CACHOEIRA_BEACH_SPOT_CAMPAIGN",
  ];
  for (const n of segundo) assert.equal(toqueDaCampanha(n), "2T", n);
  for (const n of primeiro) assert.equal(toqueDaCampanha(n), "1T", n);
});

const cota = (statusAtual: string, vendas: string | null, reservas: string | null = null): CotaStatus => ({
  spotChave: "X",
  cota: "1",
  statusAtual,
  primeiraVendaEm: vendas,
  primeiraReservaEm: reservas,
});
const semana = (d: string) => new Date(d + "T00:00:00Z");

// Datas reais do Nekt em 10/11/2026 (sup_bd_szi_szi_spot_building_unit_marketplaces)
test("venda: venda do lançamento não vira 'vendida antes' (Cachoeira Beach 328, opp 02/11)", () => {
  assert.deepEqual(statusDeVenda(cota("disponivel", "2025-02-26"), semana("2026-11-02")), { venda: "disponivel", vendaEm: null });
});

test("venda: Sul da Ilha 222 (venda de 2024, opp 26/10) segue disponível", () => {
  assert.deepEqual(statusDeVenda(cota("disponivel", "2024-09-17"), semana("2026-10-26")), { venda: "disponivel", vendaEm: null });
});

test("venda: Barra Grande 222 (venda 07/07, negociação 03/11, opp 02/11) aparece em negociação", () => {
  assert.deepEqual(statusDeVenda(cota("negociacao", "2026-07-07", "2026-11-03"), semana("2026-11-02")), {
    venda: "reservada",
    vendaEm: "2026-11-03",
  });
});

test("venda: reserva antiga não esconde a reserva nova (Ingleses 103)", () => {
  assert.equal(statusDeVenda(cota("negociacao", null, "2024-07-26,2026-11-03"), semana("2026-11-02")).vendaEm, "2026-11-03");
});

test("venda: venda depois da opp, dentro de 30 dias, conta (Campeche 504)", () => {
  assert.deepEqual(statusDeVenda(cota("vendida", "2026-09-02", "2024-07-01"), semana("2026-08-17")), {
    venda: "vendida",
    vendaEm: "2026-09-02",
  });
});

test("venda: com venda antiga e venda nova, vale a nova (Meireles 804)", () => {
  assert.deepEqual(statusDeVenda(cota("vendida", "2025-03-18,2026-10-21"), semana("2026-10-12")), {
    venda: "vendida",
    vendaEm: "2026-10-21",
  });
});

test("venda: cota que hoje consta vendida e só tem venda anterior à opp é 'vendida antes'", () => {
  assert.deepEqual(statusDeVenda(cota("vendida", "2024-07-29"), semana("2026-10-05")), {
    venda: "vendida-antes",
    vendaEm: "2024-07-29",
  });
});

test("venda: venda depois de 30 dias não conta como da opp", () => {
  assert.equal(statusDeVenda(cota("vendida", "2026-12-20"), semana("2026-11-02")).venda, "sem-dado");
});

test("venda: dado antigo (uma data só, gravado antes do ajuste) continua sendo lido", () => {
  assert.equal(statusDeVenda(cota("vendida", "2026-11-05"), semana("2026-11-02")).venda, "vendida");
  assert.equal(statusDeVenda(undefined, semana("2026-11-02")).venda, "sem-dado");
});
