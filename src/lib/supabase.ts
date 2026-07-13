import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import type { Sale } from '@/types'

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
}

export async function fetchRawSales(): Promise<RawSale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, amount, status, is_organic')
    .order('sale_date', { ascending: false })
    .limit(2000)
  if (error || !data) return []
  return data.map(row => ({
    date: row.sale_date,
    amount: Number(row.amount),
    status: row.status,
    isOrganic: Boolean(row.is_organic),
  }))
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
