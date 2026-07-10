import type { Campaign, Sale, DailyMetric, KPIMetrics } from '@/types'

// ─── Daily metrics (last 30 days) ────────────────────────────────────────────

export const dailyData: DailyMetric[] = [
  { date: '09/06', revenue: 1440, spend: 287, sales: 2 },
  { date: '10/06', revenue: 2160, spend: 412, sales: 3 },
  { date: '11/06', revenue: 720,  spend: 198, sales: 1 },
  { date: '12/06', revenue: 960,  spend: 215, sales: 1 },
  { date: '13/06', revenue: 2400, spend: 487, sales: 4 },
  { date: '14/06', revenue: 1800, spend: 345, sales: 2 },
  { date: '15/06', revenue: 1440, spend: 298, sales: 2 },
  { date: '16/06', revenue: 2880, spend: 534, sales: 4 },
  { date: '17/06', revenue: 720,  spend: 180, sales: 1 },
  { date: '18/06', revenue: 1200, spend: 234, sales: 2 },
  { date: '19/06', revenue: 2400, spend: 478, sales: 3 },
  { date: '20/06', revenue: 3120, spend: 612, sales: 4 },
  { date: '21/06', revenue: 1440, spend: 312, sales: 2 },
  { date: '22/06', revenue: 720,  spend: 167, sales: 1 },
  { date: '23/06', revenue: 1200, spend: 245, sales: 2 },
  { date: '24/06', revenue: 2640, spend: 521, sales: 4 },
  { date: '25/06', revenue: 1800, spend: 356, sales: 2 },
  { date: '26/06', revenue: 3600, spend: 698, sales: 5 },
  { date: '27/06', revenue: 960,  spend: 189, sales: 1 },
  { date: '28/06', revenue: 720,  spend: 154, sales: 1 },
  { date: '29/06', revenue: 2160, spend: 423, sales: 3 },
  { date: '30/06', revenue: 1440, spend: 278, sales: 2 },
  { date: '01/07', revenue: 2880, spend: 567, sales: 4 },
  { date: '02/07', revenue: 1200, spend: 234, sales: 2 },
  { date: '03/07', revenue: 720,  spend: 143, sales: 1 },
  { date: '04/07', revenue: 3360, spend: 645, sales: 5 },
  { date: '05/07', revenue: 2400, spend: 467, sales: 3 },
  { date: '06/07', revenue: 1800, spend: 356, sales: 2 },
  { date: '07/07', revenue: 2160, spend: 423, sales: 3 },
  { date: '08/07', revenue: 2880, spend: 534, sales: 4 },
]

// ─── Sales by source (pie chart) ─────────────────────────────────────────────

export const salesBySource = [
  { name: 'Facebook', value: 48 },
  { name: 'Orgânico', value: 13 },
  { name: 'WhatsApp', value: 8 },
  { name: 'Outros',   value: 3 },
]

// ─── KPI metrics per period ───────────────────────────────────────────────────

export const mockMetrics: Record<'today' | '7d' | '30d', KPIMetrics> = {
  today: {
    grossRevenue: 2880, adSpend: 534,
    cpm: 13.20, ctr: 3.5, cpc: 1.92, cpv: 0.09, cpi: 0.34,
    cpa: 133.5, roas: 5.39,
    tax: 432, profit: 1914, sales: 4,
    prevGrossRevenue: 2160, prevAdSpend: 423,
    prevCpm: 14.10, prevCtr: 3.1, prevCpc: 2.05, prevCpv: 0.10, prevCpi: 0.37,
    prevCpa: 141, prevRoas: 5.11,
    prevTax: 324, prevProfit: 1413, prevSales: 3,
  },
  '7d': {
    grossRevenue: 17400, adSpend: 3168,
    cpm: 12.10, ctr: 3.0, cpc: 1.78, cpv: 0.07, cpi: 0.29,
    cpa: 126.7, roas: 5.49,
    tax: 2610, profit: 11622, sales: 25,
    prevGrossRevenue: 14280, prevAdSpend: 2754,
    prevCpm: 13.40, prevCtr: 2.7, prevCpc: 1.95, prevCpv: 0.08, prevCpi: 0.32,
    prevCpa: 138.9, prevRoas: 5.19,
    prevTax: 2142, prevProfit: 9384, prevSales: 19,
  },
  '30d': {
    grossRevenue: 55560, adSpend: 9976,
    cpm: 12.40, ctr: 3.2, cpc: 1.85, cpv: 0.08, cpi: 0.31,
    cpa: 131.6, roas: 5.57,
    tax: 8334, profit: 37250, sales: 72,
    prevGrossRevenue: 47200, prevAdSpend: 8940,
    prevCpm: 13.80, prevCtr: 2.9, prevCpc: 2.01, prevCpv: 0.09, prevCpi: 0.34,
    prevCpa: 143.5, prevRoas: 5.28,
    prevTax: 7080, prevProfit: 31180, prevSales: 61,
  },
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export const mockCampaigns: Campaign[] = [
  {
    id: 'c1', name: 'Campanha - Curso de Tráfego Pago', status: 'active',
    spend: 2340, sales: 18, revenue: 12960, roi: 453.8, roas: 5.54, cpa: 130,
    cpm: 12.50, cpc: 1.85, impressions: 187200, clicks: 12648,
    adSets: [
      {
        id: 'as1-1', name: 'Público Quente — Compradores', status: 'active',
        spend: 1200, sales: 10, revenue: 7200, roi: 500, roas: 6.0, cpa: 120,
        cpm: 11.20, cpc: 1.65, impressions: 107142, clicks: 7272,
        ads: [
          { id: 'a1-1-1', name: 'Vídeo — Depoimento Cliente', status: 'active',
            spend: 680, sales: 6, revenue: 4320, roi: 535.3, roas: 6.35, cpa: 113.3,
            cpm: 10.80, cpc: 1.55, impressions: 62962, clicks: 4387 },
          { id: 'a1-1-2', name: 'Imagem — Oferta com Desconto', status: 'active',
            spend: 520, sales: 4, revenue: 2880, roi: 453.8, roas: 5.54, cpa: 130,
            cpm: 11.80, cpc: 1.78, impressions: 44067, clicks: 2921 },
        ],
      },
      {
        id: 'as1-2', name: 'Lookalike 1% — Compradores', status: 'active',
        spend: 1140, sales: 8, revenue: 5760, roi: 405.3, roas: 5.05, cpa: 142.5,
        cpm: 14.20, cpc: 2.10, impressions: 80281, clicks: 5428,
        ads: [
          { id: 'a1-2-1', name: 'Carrossel — Benefícios do Curso', status: 'active',
            spend: 640, sales: 5, revenue: 3600, roi: 462.5, roas: 5.63, cpa: 128,
            cpm: 13.50, cpc: 1.98, impressions: 47407, clicks: 3232 },
          { id: 'a1-2-2', name: 'Vídeo — Aula Gratuita', status: 'paused',
            spend: 500, sales: 3, revenue: 2160, roi: 332, roas: 4.32, cpa: 166.7,
            cpm: 15.00, cpc: 2.25, impressions: 33333, clicks: 2222 },
        ],
      },
    ],
  },
  {
    id: 'c2', name: 'Remarketing - Mentoria Premium', status: 'active',
    spend: 1890, sales: 6, revenue: 14400, roi: 661.9, roas: 7.62, cpa: 315,
    cpm: 18.70, cpc: 2.45, impressions: 101069, clicks: 7714,
    adSets: [
      {
        id: 'as2-1', name: 'Visitantes — Página de Vendas', status: 'active',
        spend: 1050, sales: 4, revenue: 9600, roi: 814.3, roas: 9.14, cpa: 262.5,
        cpm: 17.50, cpc: 2.20, impressions: 60000, clicks: 4772,
        ads: [
          { id: 'a2-1-1', name: 'Vídeo — Cases de Sucesso', status: 'active',
            spend: 620, sales: 3, revenue: 7200, roi: 1061.3, roas: 11.61, cpa: 206.7,
            cpm: 16.80, cpc: 2.10, impressions: 36904, clicks: 2952 },
          { id: 'a2-1-2', name: 'Imagem — Garantia e Resultado', status: 'active',
            spend: 430, sales: 1, revenue: 2400, roi: 458.1, roas: 5.58, cpa: 430,
            cpm: 18.70, cpc: 2.34, impressions: 22994, clicks: 1837 },
        ],
      },
      {
        id: 'as2-2', name: 'Engajados — Vídeo 75%', status: 'active',
        spend: 840, sales: 2, revenue: 4800, roi: 471.4, roas: 5.71, cpa: 420,
        cpm: 20.50, cpc: 2.78, impressions: 40975, clicks: 3021,
        ads: [
          { id: 'a2-2-1', name: 'Carrossel — Detalhes da Mentoria', status: 'active',
            spend: 840, sales: 2, revenue: 4800, roi: 471.4, roas: 5.71, cpa: 420,
            cpm: 20.50, cpc: 2.78, impressions: 40975, clicks: 3021 },
        ],
      },
    ],
  },
  {
    id: 'c3', name: 'Topo de Funil - Ebook Gratuito', status: 'active',
    spend: 1560, sales: 31, revenue: 8928, roi: 472.3, roas: 5.72, cpa: 50.3,
    cpm: 8.40, cpc: 0.92, impressions: 185714, clicks: 16956,
    adSets: [
      {
        id: 'as3-1', name: 'Interesse — Marketing Digital', status: 'active',
        spend: 890, sales: 18, revenue: 5184, roi: 482.5, roas: 5.83, cpa: 49.4,
        cpm: 8.10, cpc: 0.88, impressions: 109876, clicks: 10113,
        ads: [
          { id: 'a3-1-1', name: 'Imagem — Ebook Cover', status: 'active',
            spend: 540, sales: 11, revenue: 3168, roi: 486.7, roas: 5.87, cpa: 49.1,
            cpm: 7.80, cpc: 0.84, impressions: 69230, clicks: 6428 },
          { id: 'a3-1-2', name: 'Vídeo — Preview Ebook', status: 'active',
            spend: 350, sales: 7, revenue: 2016, roi: 476, roas: 5.76, cpa: 50,
            cpm: 8.50, cpc: 0.93, impressions: 41176, clicks: 3763 },
        ],
      },
      {
        id: 'as3-2', name: 'Lookalike 2% — Leads Anteriores', status: 'active',
        spend: 670, sales: 13, revenue: 3744, roi: 459, roas: 5.59, cpa: 51.5,
        cpm: 8.80, cpc: 0.97, impressions: 76136, clicks: 6907,
        ads: [
          { id: 'a3-2-1', name: 'Carrossel — Capítulos do Ebook', status: 'active',
            spend: 670, sales: 13, revenue: 3744, roi: 459, roas: 5.59, cpa: 51.5,
            cpm: 8.80, cpc: 0.97, impressions: 76136, clicks: 6907 },
        ],
      },
    ],
  },
  {
    id: 'c4', name: 'Conversão - Consultoria 1:1', status: 'active',
    spend: 1230, sales: 5, revenue: 9000, roi: 631.7, roas: 7.32, cpa: 246,
    cpm: 22.30, cpc: 3.10, impressions: 55157, clicks: 3967,
    adSets: [
      {
        id: 'as4-1', name: 'Interesses — Empreendedores', status: 'active',
        spend: 780, sales: 3, revenue: 5400, roi: 592.3, roas: 6.92, cpa: 260,
        cpm: 21.70, cpc: 3.00, impressions: 35944, clicks: 2600,
        ads: [
          { id: 'a4-1-1', name: 'Vídeo — Resultados de Clientes', status: 'active',
            spend: 780, sales: 3, revenue: 5400, roi: 592.3, roas: 6.92, cpa: 260,
            cpm: 21.70, cpc: 3.00, impressions: 35944, clicks: 2600 },
        ],
      },
      {
        id: 'as4-2', name: 'Lookalike — Clientes Consultoria', status: 'active',
        spend: 450, sales: 2, revenue: 3600, roi: 700, roas: 8, cpa: 225,
        cpm: 23.10, cpc: 3.24, impressions: 19480, clicks: 1388,
        ads: [
          { id: 'a4-2-1', name: 'Imagem — Proposta de Valor', status: 'active',
            spend: 450, sales: 2, revenue: 3600, roi: 700, roas: 8, cpa: 225,
            cpm: 23.10, cpc: 3.24, impressions: 19480, clicks: 1388 },
        ],
      },
    ],
  },
  {
    id: 'c5', name: 'Retargeting - Carrinho Abandonado', status: 'active',
    spend: 876, sales: 9, revenue: 6480, roi: 640, roas: 7.40, cpa: 97.3,
    cpm: 15.60, cpc: 1.92, impressions: 56153, clicks: 4562,
    adSets: [
      {
        id: 'as5-1', name: 'Carrinho Abandonado — 1 dia', status: 'active',
        spend: 520, sales: 6, revenue: 4320, roi: 730.8, roas: 8.31, cpa: 86.7,
        cpm: 14.80, cpc: 1.78, impressions: 35135, clicks: 2921,
        ads: [
          { id: 'a5-1-1', name: 'Imagem — Urgência Oferta', status: 'active',
            spend: 320, sales: 4, revenue: 2880, roi: 800, roas: 9, cpa: 80,
            cpm: 14.20, cpc: 1.68, impressions: 22535, clicks: 1904 },
          { id: 'a5-1-2', name: 'Vídeo — Lembrete Produto', status: 'active',
            spend: 200, sales: 2, revenue: 1440, roi: 620, roas: 7.2, cpa: 100,
            cpm: 15.60, cpc: 1.92, impressions: 12820, clicks: 1041 },
        ],
      },
      {
        id: 'as5-2', name: 'Carrinho Abandonado — 3 dias', status: 'active',
        spend: 356, sales: 3, revenue: 2160, roi: 507, roas: 6.07, cpa: 118.7,
        cpm: 16.80, cpc: 2.10, impressions: 21190, clicks: 1695,
        ads: [
          { id: 'a5-2-1', name: 'Carrossel — Benefícios Produto', status: 'active',
            spend: 356, sales: 3, revenue: 2160, roi: 507, roas: 6.07, cpa: 118.7,
            cpm: 16.80, cpc: 2.10, impressions: 21190, clicks: 1695 },
        ],
      },
    ],
  },
  {
    id: 'c6', name: 'Campanha - Workshop Online', status: 'paused',
    spend: 645, sales: 7, revenue: 2079, roi: 222.3, roas: 3.22, cpa: 92.1,
    cpm: 11.40, cpc: 1.48, impressions: 56578, clicks: 4358,
    adSets: [
      {
        id: 'as6-1', name: 'Interesse — Educação Online', status: 'paused',
        spend: 645, sales: 7, revenue: 2079, roi: 222.3, roas: 3.22, cpa: 92.1,
        cpm: 11.40, cpc: 1.48, impressions: 56578, clicks: 4358,
        ads: [
          { id: 'a6-1-1', name: 'Imagem — Workshop Banner', status: 'paused',
            spend: 380, sales: 4, revenue: 1188, roi: 212.6, roas: 3.13, cpa: 95,
            cpm: 11.00, cpc: 1.42, impressions: 34545, clicks: 2676 },
          { id: 'a6-1-2', name: 'Vídeo — Preview Workshop', status: 'paused',
            spend: 265, sales: 3, revenue: 891, roi: 236.2, roas: 3.36, cpa: 88.3,
            cpm: 12.00, cpc: 1.56, impressions: 22083, clicks: 1698 },
        ],
      },
    ],
  },
  {
    id: 'c7', name: 'Branding - Marca Pessoal', status: 'paused',
    spend: 480, sales: 0, revenue: 0, roi: -100, roas: 0, cpa: 0,
    cpm: 6.20, cpc: 0.78, impressions: 77419, clicks: 6153,
    adSets: [
      {
        id: 'as7-1', name: 'Público Amplo — 25-45 anos', status: 'paused',
        spend: 480, sales: 0, revenue: 0, roi: -100, roas: 0, cpa: 0,
        cpm: 6.20, cpc: 0.78, impressions: 77419, clicks: 6153,
        ads: [
          { id: 'a7-1-1', name: 'Vídeo — Apresentação Pessoal', status: 'paused',
            spend: 480, sales: 0, revenue: 0, roi: -100, roas: 0, cpa: 0,
            cpm: 6.20, cpc: 0.78, impressions: 77419, clicks: 6153 },
        ],
      },
    ],
  },
  {
    id: 'c8', name: 'Lookalike 2% - Engajados', status: 'active',
    spend: 734, sales: 6, revenue: 4320, roi: 488.3, roas: 5.88, cpa: 122.3,
    cpm: 13.20, cpc: 1.72, impressions: 55606, clicks: 4267,
    adSets: [
      {
        id: 'as8-1', name: 'Lookalike 2% — Engajados 30d', status: 'active',
        spend: 734, sales: 6, revenue: 4320, roi: 488.3, roas: 5.88, cpa: 122.3,
        cpm: 13.20, cpc: 1.72, impressions: 55606, clicks: 4267,
        ads: [
          { id: 'a8-1-1', name: 'Vídeo — Prova Social', status: 'active',
            spend: 450, sales: 4, revenue: 2880, roi: 540, roas: 6.40, cpa: 112.5,
            cpm: 12.80, cpc: 1.65, impressions: 35156, clicks: 2727 },
          { id: 'a8-1-2', name: 'Imagem — Oferta Exclusiva', status: 'active',
            spend: 284, sales: 2, revenue: 1440, roi: 407, roas: 5.07, cpa: 142,
            cpm: 13.80, cpc: 1.82, impressions: 20579, clicks: 1560 },
        ],
      },
    ],
  },
  {
    id: 'c9', name: 'Campanha - Lançamento Produto', status: 'paused',
    spend: 1890, sales: 14, revenue: 10080, roi: 433.3, roas: 5.33, cpa: 135,
    cpm: 16.80, cpc: 2.20, impressions: 112500, clicks: 8590,
    adSets: [
      {
        id: 'as9-1', name: 'Lista de Espera — Compradores', status: 'paused',
        spend: 1020, sales: 8, revenue: 5760, roi: 464.7, roas: 5.65, cpa: 127.5,
        cpm: 15.90, cpc: 2.08, impressions: 64150, clicks: 4903,
        ads: [
          { id: 'a9-1-1', name: 'Vídeo — Contagem Regressiva', status: 'paused',
            spend: 1020, sales: 8, revenue: 5760, roi: 464.7, roas: 5.65, cpa: 127.5,
            cpm: 15.90, cpc: 2.08, impressions: 64150, clicks: 4903 },
        ],
      },
      {
        id: 'as9-2', name: 'Remarketing — Página de Vendas', status: 'paused',
        spend: 870, sales: 6, revenue: 4320, roi: 396.6, roas: 4.97, cpa: 145,
        cpm: 17.90, cpc: 2.34, impressions: 48603, clicks: 3717,
        ads: [
          { id: 'a9-2-1', name: 'Imagem — Bônus Exclusivos', status: 'paused',
            spend: 870, sales: 6, revenue: 4320, roi: 396.6, roas: 4.97, cpa: 145,
            cpm: 17.90, cpc: 2.34, impressions: 48603, clicks: 3717 },
        ],
      },
    ],
  },
  {
    id: 'c10', name: 'Conversão - Assinatura Mensal', status: 'active',
    spend: 567, sales: 24, revenue: 2328, roi: 310.6, roas: 4.11, cpa: 23.6,
    cpm: 9.10, cpc: 1.05, impressions: 62307, clicks: 5400,
    adSets: [
      {
        id: 'as10-1', name: 'Interesse — SaaS e Tecnologia', status: 'active',
        spend: 567, sales: 24, revenue: 2328, roi: 310.6, roas: 4.11, cpa: 23.6,
        cpm: 9.10, cpc: 1.05, impressions: 62307, clicks: 5400,
        ads: [
          { id: 'a10-1-1', name: 'Imagem — Preço Mensal', status: 'active',
            spend: 340, sales: 15, revenue: 1455, roi: 327.9, roas: 4.28, cpa: 22.7,
            cpm: 8.70, cpc: 1.00, impressions: 39080, clicks: 3400 },
          { id: 'a10-1-2', name: 'Vídeo — Demo da Plataforma', status: 'active',
            spend: 227, sales: 9, revenue: 873, roi: 284.6, roas: 3.85, cpa: 25.2,
            cpm: 9.70, cpc: 1.12, impressions: 23402, clicks: 2026 },
        ],
      },
    ],
  },
]

// ─── Sales ────────────────────────────────────────────────────────────────────

export const mockSales: Sale[] = [
  { id: 's1',  date: '08/07/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Campanha - Curso de Tráfego Pago',   adSet: 'Público Quente — Compradores',        ad: 'Vídeo — Depoimento Cliente',     status: 'aprovada',   type: 'paga'     },
  { id: 's2',  date: '08/07/2026', product: 'Mentoria Premium',       value: 2400, checkout: 'Kiwify',   campaign: 'Remarketing - Mentoria Premium',     adSet: 'Visitantes — Página de Vendas',       ad: 'Vídeo — Cases de Sucesso',       status: 'aprovada',   type: 'paga'     },
  { id: 's3',  date: '08/07/2026', product: 'Assinatura Mensal',      value: 97,   checkout: 'Kirvano',  campaign: 'Conversão - Assinatura Mensal',      adSet: 'Interesse — SaaS e Tecnologia',       ad: 'Imagem — Preço Mensal',          status: 'aprovada',   type: 'paga'     },
  { id: 's4',  date: '08/07/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Retargeting - Carrinho Abandonado',  adSet: 'Carrinho Abandonado — 1 dia',         ad: 'Imagem — Urgência Oferta',       status: 'aprovada',   type: 'paga'     },
  { id: 's5',  date: '07/07/2026', product: 'Mentoria Premium',       value: 2400, checkout: 'Kiwify',   campaign: 'Conversão - Consultoria 1:1',        adSet: 'Interesses — Empreendedores',         ad: 'Vídeo — Resultados de Clientes', status: 'aprovada',   type: 'paga'     },
  { id: 's6',  date: '07/07/2026', product: 'Assinatura Mensal',      value: 97,   checkout: 'Kirvano',  campaign: 'Conversão - Assinatura Mensal',      adSet: 'Interesse — SaaS e Tecnologia',       ad: 'Vídeo — Demo da Plataforma',     status: 'aprovada',   type: 'paga'     },
  { id: 's7',  date: '07/07/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Campanha - Curso de Tráfego Pago',   adSet: 'Lookalike 1% — Compradores',          ad: 'Carrossel — Benefícios do Curso', status: 'aprovada',  type: 'paga'     },
  { id: 's8',  date: '06/07/2026', product: 'Consultoria 1:1',        value: 1800, checkout: 'Kiwify',   campaign: 'Conversão - Consultoria 1:1',        adSet: 'Lookalike — Clientes Consultoria',    ad: 'Imagem — Proposta de Valor',     status: 'aprovada',   type: 'paga'     },
  { id: 's9',  date: '06/07/2026', product: 'Assinatura Mensal',      value: 97,   checkout: 'Kirvano',  campaign: 'Conversão - Assinatura Mensal',      adSet: 'Interesse — SaaS e Tecnologia',       ad: 'Imagem — Preço Mensal',          status: 'pendente',   type: 'paga'     },
  { id: 's10', date: '05/07/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Campanha - Curso de Tráfego Pago',   adSet: 'Público Quente — Compradores',        ad: 'Imagem — Oferta com Desconto',   status: 'aprovada',   type: 'paga'     },
  { id: 's11', date: '05/07/2026', product: 'Mentoria Premium',       value: 2400, checkout: 'Kiwify',   campaign: 'Remarketing - Mentoria Premium',     adSet: 'Engajados — Vídeo 75%',               ad: 'Carrossel — Detalhes da Mentoria', status: 'aprovada', type: 'paga'     },
  { id: 's12', date: '05/07/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Lookalike 2% - Engajados',           adSet: 'Lookalike 2% — Engajados 30d',        ad: 'Vídeo — Prova Social',           status: 'aprovada',   type: 'paga'     },
  { id: 's13', date: '04/07/2026', product: 'Consultoria 1:1',        value: 1800, checkout: 'Kiwify',   campaign: 'Conversão - Consultoria 1:1',        adSet: 'Interesses — Empreendedores',         ad: 'Vídeo — Resultados de Clientes', status: 'aprovada',   type: 'paga'     },
  { id: 's14', date: '04/07/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Retargeting - Carrinho Abandonado',  adSet: 'Carrinho Abandonado — 3 dias',        ad: 'Carrossel — Benefícios Produto', status: 'aprovada',   type: 'paga'     },
  { id: 's15', date: '04/07/2026', product: 'Assinatura Mensal',      value: 97,   checkout: 'Kirvano',  campaign: 'Conversão - Assinatura Mensal',      adSet: 'Interesse — SaaS e Tecnologia',       ad: 'Imagem — Preço Mensal',          status: 'aprovada',   type: 'paga'     },
  { id: 's16', date: '03/07/2026', product: 'Curso de Tráfego Pago', value: 0,    checkout: 'Hotmart',  campaign: '—',                                  adSet: '—',                                   ad: '—',                              status: 'aprovada',   type: 'organica' },
  { id: 's17', date: '02/07/2026', product: 'Mentoria Premium',       value: 2400, checkout: 'Kiwify',   campaign: 'Remarketing - Mentoria Premium',     adSet: 'Visitantes — Página de Vendas',       ad: 'Imagem — Garantia e Resultado',  status: 'reembolsada',type: 'paga'     },
  { id: 's18', date: '02/07/2026', product: 'Assinatura Mensal',      value: 97,   checkout: 'Kirvano',  campaign: 'Conversão - Assinatura Mensal',      adSet: 'Interesse — SaaS e Tecnologia',       ad: 'Vídeo — Demo da Plataforma',     status: 'aprovada',   type: 'paga'     },
  { id: 's19', date: '01/07/2026', product: 'Consultoria 1:1',        value: 0,    checkout: 'Hotmart',  campaign: '—',                                  adSet: '—',                                   ad: '—',                              status: 'aprovada',   type: 'organica' },
  { id: 's20', date: '01/07/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Campanha - Curso de Tráfego Pago',   adSet: 'Público Quente — Compradores',        ad: 'Vídeo — Depoimento Cliente',     status: 'pendente',   type: 'paga'     },
  { id: 's21', date: '30/06/2026', product: 'Assinatura Mensal',      value: 97,   checkout: 'Kirvano',  campaign: 'Conversão - Assinatura Mensal',      adSet: 'Interesse — SaaS e Tecnologia',       ad: 'Imagem — Preço Mensal',          status: 'aprovada',   type: 'paga'     },
  { id: 's22', date: '30/06/2026', product: 'Curso de Tráfego Pago', value: 720,  checkout: 'Hotmart',  campaign: 'Lookalike 2% - Engajados',           adSet: 'Lookalike 2% — Engajados 30d',        ad: 'Imagem — Oferta Exclusiva',      status: 'aprovada',   type: 'paga'     },
  { id: 's23', date: '29/06/2026', product: 'Mentoria Premium',       value: 2400, checkout: 'Kiwify',   campaign: 'Remarketing - Mentoria Premium',     adSet: 'Visitantes — Página de Vendas',       ad: 'Vídeo — Cases de Sucesso',       status: 'aprovada',   type: 'paga'     },
  { id: 's24', date: '28/06/2026', product: 'Assinatura Mensal',      value: 0,    checkout: 'Kirvano',  campaign: '—',                                  adSet: '—',                                   ad: '—',                              status: 'aprovada',   type: 'organica' },
]
