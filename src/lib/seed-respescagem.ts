"use server"

import { db } from "@/lib/db"

const empreendimentos = [
  {
    nome: "Cachoeira Beach SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Cachoeira Beach Spot Todos os detalhes estão disponíveis aqui:

https://institucional.seazone.com.br/marketplace/cachoeira-beach-spot/

Atualmente, temos as últimas unidades a partir de R$ 270.000,08, com entrada a partir de R$ 114.167,54.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 51.358,40 e renda líquida mensal de R$ 4.279,86, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 270.000,08" },
      { campo: "Entrada", valor: "R$ 114.167,54" },
      { campo: "Renda líquida anual", valor: "R$ 51.358,40" },
      { campo: "Renda líquida mensal", valor: "R$ 4.279,86" },
    ]
  },
  {
    nome: "Batel SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Batel Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/batel-spot/

Atualmente, temos as últimas unidades a partir de R$ 317.018,61, com entrada a partir de R$ 207.321,98.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 53.849,43 e renda líquida mensal de R$ 4.487,45, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 317.018,61" },
      { campo: "Entrada", valor: "R$ 207.321,98" },
      { campo: "Renda líquida anual", valor: "R$ 53.849,43" },
      { campo: "Renda líquida mensal", valor: "R$ 4.487,45" },
    ]
  },
  {
    nome: "Jurerê SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no nosso Jurerê Spot. Todos os detalhes estão disponíveis aqui:

https://institucional.seazone.com.br/marketplace/jurere-spot/

Atualmente, temos a última unidade a partir de R$ 950.000,00.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 68.833,00 e renda líquida mensal de R$ 5.736,08, com a gestão da Seazone!

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 950.000,00" },
      { campo: "Renda líquida anual", valor: "R$ 68.833,00" },
      { campo: "Renda líquida mensal", valor: "R$ 5.736,08" },
    ]
  },
  {
    nome: "Lagoa SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no nosso Lagoa Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/lagoa-spot/

O empreendimento já está em operação, e atualmente, temos as últimas unidades a partir de R$ 563.583,00.

Essa é a oportunidade perfeita para garantir renda líquida mensal média de R$ 5.120, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 563.583,00" },
      { campo: "Renda líquida mensal", valor: "R$ 5.120,00" },
    ]
  },
  {
    nome: "Rosa SPOT",
    linkImagem: "https://seazone.com.br/resultados-da-busca/s/RSO",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Rosa Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/rosa-spot/

O empreendimento já está em operação, e atualmente temos as últimas unidades a partir de R$ 450.000,00.

Essa é a oportunidade perfeita para garantir renda líquida mensal média de R$ 4.598, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 450.000,00" },
      { campo: "Renda líquida mensal", valor: "R$ 4.598,00" },
    ]
  },
  {
    nome: "Meireles SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Meireles Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/meireles-spot/

Atualmente, temos as últimas unidades a partir de R$ 306.657,94, com entrada a partir de R$ 152.905,93.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 47.472,03 e renda líquida mensal de R$ 3.956,00, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 306.657,94" },
      { campo: "Entrada", valor: "R$ 152.905,93" },
      { campo: "Renda líquida anual", valor: "R$ 47.472,03" },
      { campo: "Renda líquida mensal", valor: "R$ 3.956,00" },
    ]
  },
  {
    nome: "Campeche SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Campeche Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/campeche-spot/

Atualmente, temos as últimas unidades a partir de R$ 297.869,47, com entrada a partir de R$ 253.164,16.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 55.219,18 e renda líquida mensal de R$ 4.601,59, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 297.869,47" },
      { campo: "Entrada", valor: "R$ 253.164,16" },
      { campo: "Renda líquida anual", valor: "R$ 55.219,18" },
      { campo: "Renda líquida mensal", valor: "R$ 4.601,59" },
    ]
  },
  {
    nome: "Rosa Norte SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Rosa Norte Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/rosa-norte-spot/

Atualmente, temos as últimas unidades a partir de R$ 279.440,48, com entrada a partir de R$ 117.890,28.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 49.863,22 e renda líquida mensal de R$ 4.155,26, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 279.440,48" },
      { campo: "Entrada", valor: "R$ 117.890,28" },
      { campo: "Renda líquida anual", valor: "R$ 49.863,22" },
      { campo: "Renda líquida mensal", valor: "R$ 4.155,26" },
    ]
  },
  {
    nome: "Santo Antônio SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Santo Antônio Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/santo-antonio-spot/

Atualmente, temos as últimas unidades a partir de R$ 278.559,58, com entrada a partir de R$ 132.560,32.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 46.470,00 e renda líquida mensal de R$ 3.872,5, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 278.559,58" },
      { campo: "Entrada", valor: "R$ 132.560,32" },
      { campo: "Renda líquida anual", valor: "R$ 46.470,00" },
      { campo: "Renda líquida mensal", valor: "R$ 3.872,50" },
    ]
  },
  {
    nome: "Ingleses SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Ingleses Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/ingleses-spot/

O empreendimento será entregue nas próximas semanas e atualmente temos as últimas unidades a partir de R$ 350.000,00.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 45.586,00 e renda líquida mensal de R$ 3.798,83, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 350.000,00" },
      { campo: "Renda líquida anual", valor: "R$ 45.586,00" },
      { campo: "Renda líquida mensal", valor: "R$ 3.798,83" },
    ]
  },
  {
    nome: "Penha SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Penha Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/penha-spot/

O empreendimento já está em operação e atualmente temos as últimas unidades a partir de R$ 515.000,00.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 32.164,52 e renda líquida mensal de R$ 2.680,37, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 515.000,00" },
      { campo: "Renda líquida anual", valor: "R$ 32.164,52" },
      { campo: "Renda líquida mensal", valor: "R$ 2.680,37" },
    ]
  },
  {
    nome: "Cachoeira SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Cachoeira Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/cachoeira-spot/

Atualmente, temos as últimas unidades a partir de R$ 310.713,60, com entrada a partir de R$ 203.764,14.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 51.131,37 e renda líquida mensal de R$ 4.260,94, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 310.713,60" },
      { campo: "Entrada", valor: "R$ 203.764,14" },
      { campo: "Renda líquida anual", valor: "R$ 51.131,37" },
      { campo: "Renda líquida mensal", valor: "R$ 4.260,94" },
    ]
  },
  {
    nome: "Japaratinga SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Japaratinga Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/japaratinga-spot/

A entrega do empreendimento está prevista para dezembro e atualmente temos as últimas unidades a partir de R$ 304.178,00.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 31.522,00 e renda líquida mensal de R$ 2.626,83, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 304.178,00" },
      { campo: "Renda líquida anual", valor: "R$ 31.522,00" },
      { campo: "Renda líquida mensal", valor: "R$ 2.626,83" },
    ]
  },
  {
    nome: "Sul da Ilha SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Sul da Ilha Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/sul-da-ilha-spot/

Atualmente, temos as últimas unidades a partir de R$ 277.968,60, com entrada a partir de R$ 148.974,09.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 55.219,18 e renda líquida mensal de R$ 4.601,60, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 277.968,60" },
      { campo: "Entrada", valor: "R$ 148.974,09" },
      { campo: "Renda líquida anual", valor: "R$ 55.219,18" },
      { campo: "Renda líquida mensal", valor: "R$ 4.601,60" },
    ]
  },
  {
    nome: "Salvador SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Salvador Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/salvador-spot/

Atualmente, temos as últimas unidades a partir de R$ 320.767,01, com entrada a partir de R$ 183.545,57.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 47.443,24 e renda líquida mensal de R$ 3.953,60, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 320.767,01" },
      { campo: "Entrada", valor: "R$ 183.545,57" },
      { campo: "Renda líquida anual", valor: "R$ 47.443,24" },
      { campo: "Renda líquida mensal", valor: "R$ 3.953,60" },
    ]
  },
  {
    nome: "Canasvieiras SPOT",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Canasvieiras Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/canasvieiras-spot/

Atualmente, temos as últimas unidades a partir de R$ 235.000,00.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 47.924,28 e renda líquida mensal de R$ 3.993,69, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 235.000,00" },
      { campo: "Renda líquida anual", valor: "R$ 47.924,28" },
      { campo: "Renda líquida mensal", valor: "R$ 3.993,69" },
    ]
  },
  {
    nome: "Ilha do Campeche Spot II",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Ilha do Campeche Spot II. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/ilha-do-campeche-spot-ii/

Atualmente, temos as últimas unidades a partir de R$ 335.284,44, com entrada a partir de R$ 185.730,23.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 79.452,85 e renda líquida mensal de R$ 6.621,07, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 335.284,44" },
      { campo: "Entrada", valor: "R$ 185.730,23" },
      { campo: "Renda líquida anual", valor: "R$ 79.452,85" },
      { campo: "Renda líquida mensal", valor: "R$ 6.621,07" },
    ]
  },
  {
    nome: "Morro das Pedras Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Morro das Pedras Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/morro-das-pedras-spot/

Atualmente, temos as últimas unidades a partir de R$ 331.677,46, com entrada a partir de R$ 182.621,10.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 54.234,59 e renda líquida mensal de R$ 4.519,54, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 331.677,46" },
      { campo: "Entrada", valor: "R$ 182.621,10" },
      { campo: "Renda líquida anual", valor: "R$ 54.234,59" },
      { campo: "Renda líquida mensal", valor: "R$ 4.519,54" },
    ]
  },
  {
    nome: "Trancoso Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Trancoso Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/trancoso-spot/

O empreendimento tem entrega prevista para setembro e atualmente temos as últimas unidades a partir de R$ 768.911,50, com entrada a partir de R$ 735.282,90.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 72.253,20 e renda líquida mensal de R$ 6.021,10, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 768.911,50" },
      { campo: "Entrada", valor: "R$ 735.282,90" },
      { campo: "Renda líquida anual", valor: "R$ 72.253,20" },
      { campo: "Renda líquida mensal", valor: "R$ 6.021,10" },
    ]
  },
  {
    nome: "Urubici Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Urubici Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/urubici-spot/

Atualmente, temos as últimas unidades a partir de R$ 286.085,96.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 35.927,00 e renda líquida mensal de R$ 2.993,91, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 286.085,96" },
      { campo: "Renda líquida anual", valor: "R$ 35.927,00" },
      { campo: "Renda líquida mensal", valor: "R$ 2.993,91" },
    ]
  },
  {
    nome: "Rosa Sul Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Rosa Sul Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/rosa-sul-spot/

O empreendimento tem entrega prevista para setembro e atualmente temos as últimas unidades a partir de R$ 398.000,00.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 49.863,22 e renda líquida mensal de R$ 4.155,26, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 398.000,00" },
      { campo: "Renda líquida anual", valor: "R$ 49.863,22" },
      { campo: "Renda líquida mensal", valor: "R$ 4.155,26" },
    ]
  },
  {
    nome: "Foz Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Foz Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/foz-spot-lancamento/

Atualmente, temos as últimas unidades a partir de R$ 251.602,06, com entrada a partir de R$ 127.158,31.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 42.338,66 e renda líquida mensal de R$ 3.528,22, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 251.602,06" },
      { campo: "Entrada", valor: "R$ 127.158,31" },
      { campo: "Renda líquida anual", valor: "R$ 42.338,66" },
      { campo: "Renda líquida mensal", valor: "R$ 3.528,22" },
    ]
  },
  {
    nome: "Santinho Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Santinho Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/santinho-spot-2/

Atualmente, temos as últimas unidades a partir de R$ 230.000,17, com entrada a partir de R$ 89.491,50.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 50.264,00 e renda líquida mensal de R$ 4.188,66, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 230.000,17" },
      { campo: "Entrada", valor: "R$ 89.491,50" },
      { campo: "Renda líquida anual", valor: "R$ 50.264,00" },
      { campo: "Renda líquida mensal", valor: "R$ 4.188,66" },
    ]
  },
  {
    nome: "Ponta das Canas Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Ponta das Canas Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/ponta-das-canas-spot/

Atualmente, temos as últimas unidades a partir de R$ 230.000,16, com entrada a partir de R$ 82.850,49.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 53.829,98 e renda líquida mensal de R$ 4.485,83, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 230.000,16" },
      { campo: "Entrada", valor: "R$ 82.850,49" },
      { campo: "Renda líquida anual", valor: "R$ 53.829,98" },
      { campo: "Renda líquida mensal", valor: "R$ 4.485,83" },
    ]
  },
  {
    nome: "Bonito Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Bonito Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/bonito-spot/

Atualmente, temos as últimas unidades a partir de R$ 208.717,04, com entrada a partir de R$ 48.321,16.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 34.970,17 e renda líquida mensal de R$ 2.914,18, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 208.717,04" },
      { campo: "Entrada", valor: "R$ 48.321,16" },
      { campo: "Renda líquida anual", valor: "R$ 34.970,17" },
      { campo: "Renda líquida mensal", valor: "R$ 2.914,18" },
    ]
  },
  {
    nome: "Novo Campeche Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Novo Campeche Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/novo-campeche/

Atualmente, temos as últimas unidades a partir de R$ 321.475,66, com entrada a partir de R$ 21.431,70.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 66.424,18 e renda líquida mensal de R$ 5.535,34, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 321.475,66" },
      { campo: "Entrada", valor: "R$ 21.431,70" },
      { campo: "Renda líquida anual", valor: "R$ 66.424,18" },
      { campo: "Renda líquida mensal", valor: "R$ 5.535,34" },
    ]
  },
  {
    nome: "Canas Beach Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Canas Beach Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/canas-beach-spot/

Atualmente, temos as últimas unidades a partir de R$ 252.084,76, com entrada a partir de R$ 113.004,52.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 50.078,14 e renda líquida mensal de R$ 4.173,17, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 252.084,76" },
      { campo: "Entrada", valor: "R$ 113.004,52" },
      { campo: "Renda líquida anual", valor: "R$ 50.078,14" },
      { campo: "Renda líquida mensal", valor: "R$ 4.173,17" },
    ]
  },
  {
    nome: "Jurerê Beach Spot",
    texto: `Oi, [NOME]! Como você está?

Recebemos em nosso sistema que você demonstrou interesse no Jurerê Beach Spot. Todos os detalhes estão disponíveis aqui: https://institucional.seazone.com.br/marketplace/jurere-beach-spot/

Atualmente, temos as últimas unidades a partir de R$ 531.795,56, com entrada a partir de R$ 345.092,73.

Essa é a oportunidade perfeita para garantir renda líquida anual estimada de R$ 61.476,86 e renda líquida mensal de R$ 5.123,07, com a gestão da Seazone!

Pagamento exclusivamente via pix ou parcelamento. Não aceitamos FGTS nem carta de crédito.

Gostaria de agendar uma reunião para conhecer melhor o nosso modelo de negócio?`,
    numeros: [
      { campo: "Valor total", valor: "R$ 531.795,56" },
      { campo: "Entrada", valor: "R$ 345.092,73" },
      { campo: "Renda líquida anual", valor: "R$ 61.476,86" },
      { campo: "Renda líquida mensal", valor: "R$ 5.123,07" },
    ]
  },
]

export async function seedRepescagem() {
  let created = 0
  let numbersCreated = 0

  for (const emp of empreendimentos) {
    try {
      const existing = await db.repescagemEmpreendimento.findFirst({
        where: { nomeEmpreendimento: emp.nome }
      })

      if (!existing) {
        const createdEmp = await db.repescagemEmpreendimento.create({
          data: {
            nomeEmpreendimento: emp.nome,
            textoConteudo: emp.texto,
            linkImagem: emp.linkImagem || null,
          }
        })

        for (const num of emp.numeros) {
          await db.repescagemNumero.create({
            data: {
              empreendimentoId: createdEmp.id,
              campoNome: num.campo,
              valorAtual: num.valor,
              sinalizador: null,
            }
          })
          numbersCreated++
        }

        created++
      }
    } catch (error) {
      console.error(`Erro ao criar ${emp.nome}:`, error)
    }
  }

  return { created, numbersCreated }
}