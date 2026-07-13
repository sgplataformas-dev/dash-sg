import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import type { Sale, Campaign, CampaignStatus } from '@/types'

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

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('id, sale_date, product_name, amount, checkout_platform, utm_campaign, status, is_organic')
    .order('sale_date', { ascending: false })
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    date: format(new Date(row.sale_date), 'dd/MM/yyyy'),
    product: row.product_name ?? '—',
    value: Number(row.amount),
    checkout: (row.checkout_platform.charAt(0).toUpperCase() + row.checkout_platform.slice(1)) as Sale['checkout'],
    campaign: row.utm_campaign ?? '—',
    adSet: '—',
    ad: '—',
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
}

export async function fetchRawSales(): Promise<RawSale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, amount, status, is_organic, product_name, payment_method, utm_source')
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
  }))
}

function fbStatus(s: string | null): CampaignStatus {
  return s === 'ACTIVE' ? 'active' : 'paused'
}

export async function fetchCampaignsFull(): Promise<Campaign[]> {
  const [campaignsRes, adSetsRes, adsRes] = await Promise.all([
    supabase.from('v_campaign_performance').select('campaign_id, campaign_name, status, spend, impressions, clicks, cpm, cpc, revenue, sales, roas, cpa'),
    supabase.from('ad_sets').select('id, campaign_id, adset_name, status, spend, impressions, clicks, cpm, cpc'),
    supabase.from('v_ad_performance').select('ad_id, ad_name, status, spend, impressions, clicks, cpm, cpc, revenue, sales, roas, cpa, ad_set_id'),
  ])
  if (campaignsRes.error || !campaignsRes.data) return []

  const adsByAdSet = new Map<string, typeof adsRes.data>()
  ;(adsRes.data ?? []).forEach(ad => {
    if (!ad.ad_set_id) return
    const list = adsByAdSet.get(ad.ad_set_id) ?? []
    list.push(ad)
    adsByAdSet.set(ad.ad_set_id, list)
  })

  return campaignsRes.data.map(c => {
    const campaignAdSets = (adSetsRes.data ?? []).filter(a => a.campaign_id === c.campaign_id)
    const adSets = campaignAdSets.map(a => {
      const ads = adsByAdSet.get(a.id) ?? []
      const revenue = ads.reduce((sum, ad) => sum + Number(ad.revenue ?? 0), 0)
      const salesCount = ads.reduce((sum, ad) => sum + Number(ad.sales ?? 0), 0)
      const spend = Number(a.spend ?? 0)
      return {
        id: a.id,
        name: a.adset_name,
        status: fbStatus(a.status),
        spend,
        sales: salesCount,
        revenue,
        roi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: salesCount > 0 ? spend / salesCount : 0,
        cpm: Number(a.cpm ?? 0),
        cpc: Number(a.cpc ?? 0),
        impressions: Number(a.impressions ?? 0),
        clicks: Number(a.clicks ?? 0),
        ads: ads.map(ad => ({
          id: ad.ad_id,
          name: ad.ad_name,
          status: fbStatus(ad.status),
          spend: Number(ad.spend ?? 0),
          sales: Number(ad.sales ?? 0),
          revenue: Number(ad.revenue ?? 0),
          roi: Number(ad.spend) > 0 ? ((Number(ad.revenue ?? 0) - Number(ad.spend)) / Number(ad.spend)) * 100 : 0,
          roas: Number(ad.roas ?? 0),
          cpa: Number(ad.cpa ?? 0),
          cpm: Number(ad.cpm ?? 0),
          cpc: Number(ad.cpc ?? 0),
          impressions: Number(ad.impressions ?? 0),
          clicks: Number(ad.clicks ?? 0),
        })),
      }
    })

    return {
      id: c.campaign_id,
      name: c.campaign_name,
      status: fbStatus(c.status),
      spend: Number(c.spend ?? 0),
      sales: Number(c.sales ?? 0),
      revenue: Number(c.revenue ?? 0),
      roi: Number(c.spend) > 0 ? ((Number(c.revenue ?? 0) - Number(c.spend)) / Number(c.spend)) * 100 : 0,
      roas: Number(c.roas ?? 0),
      cpa: Number(c.cpa ?? 0),
      cpm: Number(c.cpm ?? 0),
      cpc: Number(c.cpc ?? 0),
      impressions: Number(c.impressions ?? 0),
      clicks: Number(c.clicks ?? 0),
      adSets,
    }
  })
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
