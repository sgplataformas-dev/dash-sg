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

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('id, date, product, value, checkout, campaign, ad_set, ad, status, type')
    .order('date', { ascending: false })
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    date: format(new Date(row.date), 'dd/MM/yyyy'),
    product: row.product,
    value: Number(row.value),
    checkout: row.checkout,
    campaign: row.campaign ?? '—',
    adSet: row.ad_set ?? '—',
    ad: row.ad ?? '—',
    status: row.status,
    type: row.type,
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
