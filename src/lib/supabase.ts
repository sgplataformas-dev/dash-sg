import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import type { Sale, Campaign, CampaignStatus, ActionLogEntry } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const PREFIX = 'sg_setting_'

export function getSetting(key: string): string | null {
  try { return localStorage.getItem(PREFIX + key) } catch { return null }
}

export function setSetting(key: string, value: string): void {
  try { localStorage.setItem(PREFIX + key, value) } catch {}
  supabase.from('settings').upsert({ key, value }, { onConflict: 'key' }).then(() => {})
}

export async function saveSetting(key: string, value: string): Promise<void> {
  try { localStorage.setItem(PREFIX + key, value) } catch {}
  const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
}

export function deleteSetting(key: string): void {
  try { localStorage.removeItem(PREFIX + key) } catch {}
  supabase.from('settings').delete().eq('key', key).then(() => {})
}

const dbStatusToSaleStatus: Record<string, Sale['status']> = {
  approved: 'aprovada',
  pending: 'pendente',
  refunded: 'reembolsada',
  cancelled: 'reembolsada',
  chargeback: 'reembolsada',
}

export async function fetchSales(since?: Date, until?: Date): Promise<Sale[]> {
  let query = supabase
    .from('sales')
    .select('id, sale_date, product_name, amount, checkout_platform, utm_campaign, status, is_organic, matched_campaign:campaigns!matched_campaign_id(campaign_name), matched_ad_set:ad_sets!matched_ad_set_id(adset_name), matched_ad:ads!matched_ad_id(ad_name)')
    .order('sale_date', { ascending: false })
  if (since) query = query.gte('sale_date', since.toISOString())
  if (until) query = query.lte('sale_date', until.toISOString())
  const { data, error } = await query
  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    date: format(new Date(row.sale_date), 'dd/MM/yyyy'),
    product: row.product_name ?? '—',
    value: Number(row.amount),
    checkout: (row.checkout_platform.charAt(0).toUpperCase() + row.checkout_platform.slice(1)) as Sale['checkout'],
    campaign: row.matched_campaign?.campaign_name ?? row.utm_campaign ?? '—',
    adSet: row.matched_ad_set?.adset_name ?? '—',
    ad: row.matched_ad?.ad_name ?? '—',
    status: dbStatusToSaleStatus[row.status] ?? 'pendente',
    type: row.is_organic ? 'organica' : 'paga',
  }))
}

export interface RawSale {
  date: string
  amount: number
  status: string
  isOrganic: boolean
  productName: string | null
  paymentMethod: string | null
  utmSource: string | null
  customerEmail: string | null
}

export async function fetchRawSales(): Promise<RawSale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, amount, status, is_organic, product_name, payment_method, utm_source, buyer_email')
    .order('sale_date', { ascending: false })
    .limit(2000)
  if (error || !data) return []
  return data.map(row => ({
    date: row.sale_date,
    amount: Number(row.amount),
    status: row.status,
    isOrganic: Boolean(row.is_organic),
    productName: row.product_name,
    paymentMethod: row.payment_method,
    utmSource: row.utm_source,
    customerEmail: row.buyer_email,
  }))
}

function fbStatus(s: string | null): CampaignStatus {
  return s === 'ACTIVE' ? 'active' : 'paused'
}

export async function fetchCampaignsFull(since?: Date, until?: Date): Promise<Campaign[]> {
  let salesQuery = supabase
    .from('sales')
    .select('matched_campaign_id, matched_ad_set_id, matched_ad_id, amount')
    .eq('status', 'approved')
  if (since) salesQuery = salesQuery.gte('sale_date', since.toISOString())
  if (until) salesQuery = salesQuery.lte('sale_date', until.toISOString())

  const [campaignsRes, adSetsRes, adsRes, salesRes] = await Promise.all([
    supabase.from('campaigns').select('id, campaign_name, status, spend, impressions, clicks, cpm, cpc, ctr, cpv, cpi, fb_purchases'),
    supabase.from('ad_sets').select('id, campaign_id, adset_name, status, spend, impressions, clicks, cpm, cpc'),
    supabase.from('ads').select('id, ad_set_id, ad_name, status, spend, impressions, clicks, cpm, cpc'),
    salesQuery,
  ])
  if (campaignsRes.error || !campaignsRes.data) return []

  type Perf = { revenue: number; sales: number }
  const sumBy = (key: 'matched_campaign_id' | 'matched_ad_set_id' | 'matched_ad_id') => {
    const map = new Map<string, Perf>()
    ;(salesRes.data ?? []).forEach((s: any) => {
      const id = s[key]
      if (!id) return
      const curr = map.get(id) ?? { revenue: 0, sales: 0 }
      curr.revenue += Number(s.amount)
      curr.sales += 1
      map.set(id, curr)
    })
    return map
  }
  const campaignPerf = sumBy('matched_campaign_id')
  const adSetPerf = sumBy('matched_ad_set_id')
  const adPerf = sumBy('matched_ad_id')

  const adsByAdSet = new Map<string, typeof adsRes.data>()
  ;(adsRes.data ?? []).forEach(ad => {
    if (!ad.ad_set_id) return
    const list = adsByAdSet.get(ad.ad_set_id) ?? []
    list.push(ad)
    adsByAdSet.set(ad.ad_set_id, list)
  })

  return campaignsRes.data.map(c => {
    const campaignAdSets = (adSetsRes.data ?? []).filter(a => a.campaign_id === c.id)
    const adSets = campaignAdSets.map(a => {
      const ads = adsByAdSet.get(a.id) ?? []
      const perf: Perf = adSetPerf.get(a.id) ?? { revenue: 0, sales: 0 }
      const spend = Number(a.spend ?? 0)
      return {
        id: a.id,
        name: a.adset_name,
        status: fbStatus(a.status),
        spend,
        sales: perf.sales,
        revenue: perf.revenue,
        roi: spend > 0 ? ((perf.revenue - spend) / spend) * 100 : 0,
        roas: spend > 0 ? perf.revenue / spend : 0,
        cpa: perf.sales > 0 ? spend / perf.sales : 0,
        cpm: Number(a.cpm ?? 0),
        cpc: Number(a.cpc ?? 0),
        impressions: Number(a.impressions ?? 0),
        clicks: Number(a.clicks ?? 0),
        ads: ads.map(ad => {
          const adP: Perf = adPerf.get(ad.id) ?? { revenue: 0, sales: 0 }
          const adSpend = Number(ad.spend ?? 0)
          return {
            id: ad.id,
            name: ad.ad_name,
            status: fbStatus(ad.status),
            spend: adSpend,
            sales: adP.sales,
            revenue: adP.revenue,
            roi: adSpend > 0 ? ((adP.revenue - adSpend) / adSpend) * 100 : 0,
            roas: adSpend > 0 ? adP.revenue / adSpend : 0,
            cpa: adP.sales > 0 ? adSpend / adP.sales : 0,
            cpm: Number(ad.cpm ?? 0),
            cpc: Number(ad.cpc ?? 0),
            impressions: Number(ad.impressions ?? 0),
            clicks: Number(ad.clicks ?? 0),
          }
        }),
      }
    })

    const perf: Perf = campaignPerf.get(c.id) ?? { revenue: 0, sales: 0 }
    const spend = Number(c.spend ?? 0)
    return {
      id: c.id,
      name: c.campaign_name,
      status: fbStatus(c.status),
      spend,
      sales: perf.sales,
      revenue: perf.revenue,
      roi: spend > 0 ? ((perf.revenue - spend) / spend) * 100 : 0,
      roas: spend > 0 ? perf.revenue / spend : 0,
      cpa: perf.sales > 0 ? spend / perf.sales : 0,
      cpm: Number(c.cpm ?? 0),
      cpc: Number(c.cpc ?? 0),
      ctr: Number(c.ctr ?? 0),
      cpv: Number(c.cpv ?? 0),
      cpi: Number(c.cpi ?? 0),
      fbPurchases: Number(c.fb_purchases ?? 0),
      impressions: Number(c.impressions ?? 0),
      clicks: Number(c.clicks ?? 0),
      adSets,
    }
  })
}

export async function fetchActionLog(): Promise<ActionLogEntry[]> {
  const { data, error } = await supabase
    .from('action_log')
    .select('id, entry_date, campaign_name, action_taken, observed_result, created_at')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    entryDate: row.entry_date,
    campaignName: row.campaign_name,
    actionTaken: row.action_taken,
    observedResult: row.observed_result,
    createdAt: row.created_at,
  }))
}

export async function addActionLogEntry(entry: { entryDate: string; campaignName: string | null; actionTaken: string; observedResult: string | null }): Promise<void> {
  const { error } = await supabase.from('action_log').insert({
    entry_date: entry.entryDate,
    campaign_name: entry.campaignName,
    action_taken: entry.actionTaken,
    observed_result: entry.observedResult,
  })
  if (error) throw error
}

export async function deleteActionLogEntry(id: string): Promise<void> {
  const { error } = await supabase.from('action_log').delete().eq('id', id)
  if (error) throw error
}

export function subscribeToSales(onChange: () => void): () => void {
  const channel = supabase
    .channel('sales-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

export async function syncSettings(): Promise<void> {
  try {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      data.forEach(({ key, value }: { key: string; value: string | null }) => {
        try {
          if (value !== null && value !== undefined) {
            localStorage.setItem(PREFIX + key, value)
          } else {
            localStorage.removeItem(PREFIX + key)
          }
        } catch {}
      })
    }
  } catch { /* sem internet ou tabela inexistente: silencia */ }
}
