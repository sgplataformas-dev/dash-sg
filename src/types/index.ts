export type Period = 'today' | '7d' | '30d'

export type CampaignStatus = 'active' | 'paused'
export type SaleStatus = 'aprovada' | 'pendente' | 'reembolsada'
export type SaleType = 'paga' | 'organica'
export type CheckoutType = 'Payt'
export type RateType = 'percent' | 'fixed'
export type RateAppliesTo = 'revenue' | 'commission'

export interface Ad {
  id: string
  name: string
  status: CampaignStatus
  spend: number
  sales: number
  revenue: number
  roi: number
  roas: number
  cpa: number
  cpm: number
  cpc: number
  impressions: number
  clicks: number
}

export interface AdSet {
  id: string
  name: string
  status: CampaignStatus
  spend: number
  sales: number
  revenue: number
  roi: number
  roas: number
  cpa: number
  cpm: number
  cpc: number
  impressions: number
  clicks: number
  ads: Ad[]
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  spend: number
  sales: number
  revenue: number
  roi: number
  roas: number
  cpa: number
  cpm: number
  cpc: number
  ctr: number
  cpv: number
  cpi: number
  impressions: number
  clicks: number
  adSets: AdSet[]
}

export interface Sale {
  id: string
  date: string
  product: string
  value: number
  checkout: CheckoutType
  campaign: string
  adSet: string
  ad: string
  status: SaleStatus
  type: SaleType
}

export interface DailyMetric {
  date: string
  revenue: number
  spend: number
  sales: number
}

export interface KPIMetrics {
  grossRevenue: number
  adSpend: number
  cpm: number
  ctr: number
  cpc: number
  cpv: number
  cpi: number
  cpa: number
  roas: number
  tax: number
  profit: number
  sales: number
  prevGrossRevenue: number
  prevAdSpend: number
  prevCpm: number
  prevCtr: number
  prevCpc: number
  prevCpv: number
  prevCpi: number
  prevCpa: number
  prevRoas: number
  prevTax: number
  prevProfit: number
  prevSales: number
}

export interface Rate {
  id: string
  name: string
  type: RateType
  value: number
  appliesTo: RateAppliesTo
}

export interface FacebookAccount {
  id: string
  name: string
  account_id: string
}

export interface ActionLogEntry {
  id: string
  entryDate: string
  campaignName: string | null
  actionTaken: string
  observedResult: string | null
  createdAt: string
}
