export type Period = 'today' | '7d' | '30d'

export type CampaignStatus = 'active' | 'paused'
export type SaleStatus = 'aprovada' | 'pendente' | 'reembolsada'
export type SaleType = 'paga' | 'organica'
export type CheckoutType = 'Hotmart' | 'Kiwify' | 'Kirvano'
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
  netRevenue: number
  adSpend: number
  roi: number
  roas: number
  cpa: number
  sales: number
  prevGrossRevenue: number
  prevNetRevenue: number
  prevAdSpend: number
  prevRoi: number
  prevRoas: number
  prevCpa: number
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
