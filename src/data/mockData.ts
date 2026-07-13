import type { Campaign, DailyMetric, KPIMetrics } from '@/types'

// ─── Daily metrics (last 30 days) ────────────────────────────────────────────

export const dailyData: DailyMetric[] = []

// ─── Sales by source (pie chart) ─────────────────────────────────────────────

export const salesBySource: { name: string; value: number }[] = []

// ─── KPI metrics per period ───────────────────────────────────────────────────

const emptyMetrics: KPIMetrics = {
  grossRevenue: 0, adSpend: 0,
  cpm: 0, ctr: 0, cpc: 0, cpv: 0, cpi: 0,
  cpa: 0, roas: 0,
  tax: 0, profit: 0, sales: 0,
  prevGrossRevenue: 0, prevAdSpend: 0,
  prevCpm: 0, prevCtr: 0, prevCpc: 0, prevCpv: 0, prevCpi: 0,
  prevCpa: 0, prevRoas: 0,
  prevTax: 0, prevProfit: 0, prevSales: 0,
}

export const mockMetrics: Record<'today' | '7d' | '30d', KPIMetrics> = {
  today: emptyMetrics,
  '7d': emptyMetrics,
  '30d': emptyMetrics,
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export const mockCampaigns: Campaign[] = []
