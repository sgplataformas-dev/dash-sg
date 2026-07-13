import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const FB_API = 'https://graph.facebook.com/v19.0'

async function fetchAllPages(url: string, maxPages = 20): Promise<any[]> {
  const results: any[] = []
  let next: string | null = url
  let pages = 0
  while (next && pages < maxPages) {
    const res = await fetch(next)
    const json = await res.json()
    if (json.error) throw new Error(json.error.message ?? 'Facebook API error')
    results.push(...(json.data ?? []))
    next = json.paging?.next ?? null
    pages++
  }
  return results
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['facebook_token', 'facebook_ad_account_id'])

  if (settingsError) {
    return new Response(JSON.stringify({ error: settingsError.message }), { status: 500 })
  }

  const settingsMap = Object.fromEntries((settingsRows ?? []).map(r => [r.key, r.value]))
  const token = settingsMap.facebook_token
  const accountId = settingsMap.facebook_ad_account_id

  if (!token || !accountId) {
    return new Response(JSON.stringify({ error: 'Facebook não conectado. Salve o token e a conta em Integrações.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const until = new Date()
  const since = new Date(until.getTime() - 29 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const timeRange = encodeURIComponent(JSON.stringify({ since: fmt(since), until: fmt(until) }))

  try {
    // ── Campaigns ──────────────────────────────────────────────
    const campaignEntities = await fetchAllPages(
      `${FB_API}/act_${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=200&access_token=${token}`
    )
    const campaignInsights = await fetchAllPages(
      `${FB_API}/act_${accountId}/insights?level=campaign&fields=campaign_id,spend,impressions,clicks,cpm,cpc,ctr,reach&time_range=${timeRange}&limit=500&access_token=${token}`
    )
    const campaignInsightsMap = new Map(campaignInsights.map(i => [i.campaign_id, i]))

    const campaignRows = campaignEntities.map(c => {
      const ins = campaignInsightsMap.get(c.id) ?? {}
      return {
        facebook_campaign_id: c.id,
        campaign_name: c.name,
        status: c.status,
        objective: c.objective ?? null,
        daily_budget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
        lifetime_budget: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
        spend: Number(ins.spend ?? 0),
        impressions: Number(ins.impressions ?? 0),
        clicks: Number(ins.clicks ?? 0),
        cpm: Number(ins.cpm ?? 0),
        cpc: Number(ins.cpc ?? 0),
        ctr: Number(ins.ctr ?? 0),
        reach: Number(ins.reach ?? 0),
        date_start: fmt(since),
        date_stop: fmt(until),
        last_synced_at: new Date().toISOString(),
      }
    })

    let campaignIdMap = new Map<string, string>()
    if (campaignRows.length > 0) {
      const { data: upserted, error } = await supabase
        .from('campaigns')
        .upsert(campaignRows, { onConflict: 'facebook_campaign_id' })
        .select('id, facebook_campaign_id')
      if (error) throw new Error(`campaigns: ${error.message}`)
      campaignIdMap = new Map((upserted ?? []).map(c => [c.facebook_campaign_id, c.id]))
    }

    // ── Ad Sets ────────────────────────────────────────────────
    const adSetEntities = await fetchAllPages(
      `${FB_API}/act_${accountId}/adsets?fields=id,name,campaign_id,status&limit=500&access_token=${token}`
    )
    const adSetInsights = await fetchAllPages(
      `${FB_API}/act_${accountId}/insights?level=adset&fields=adset_id,spend,impressions,clicks,cpm,cpc,reach&time_range=${timeRange}&limit=500&access_token=${token}`
    )
    const adSetInsightsMap = new Map(adSetInsights.map(i => [i.adset_id, i]))

    const adSetRows = adSetEntities
      .filter(a => campaignIdMap.has(a.campaign_id))
      .map(a => {
        const ins = adSetInsightsMap.get(a.id) ?? {}
        return {
          campaign_id: campaignIdMap.get(a.campaign_id),
          facebook_adset_id: a.id,
          adset_name: a.name,
          status: a.status,
          spend: Number(ins.spend ?? 0),
          impressions: Number(ins.impressions ?? 0),
          clicks: Number(ins.clicks ?? 0),
          cpm: Number(ins.cpm ?? 0),
          cpc: Number(ins.cpc ?? 0),
          reach: Number(ins.reach ?? 0),
          last_synced_at: new Date().toISOString(),
        }
      })

    let adSetIdMap = new Map<string, string>()
    if (adSetRows.length > 0) {
      const { data: upserted, error } = await supabase
        .from('ad_sets')
        .upsert(adSetRows, { onConflict: 'facebook_adset_id' })
        .select('id, facebook_adset_id')
      if (error) throw new Error(`ad_sets: ${error.message}`)
      adSetIdMap = new Map((upserted ?? []).map(a => [a.facebook_adset_id, a.id]))
    }

    // ── Ads ────────────────────────────────────────────────────
    const adEntities = await fetchAllPages(
      `${FB_API}/act_${accountId}/ads?fields=id,name,adset_id,status&limit=500&access_token=${token}`
    )
    const adInsights = await fetchAllPages(
      `${FB_API}/act_${accountId}/insights?level=ad&fields=ad_id,spend,impressions,clicks,cpm,cpc,reach&time_range=${timeRange}&limit=500&access_token=${token}`
    )
    const adInsightsMap = new Map(adInsights.map(i => [i.ad_id, i]))

    const adRows = adEntities
      .filter(a => adSetIdMap.has(a.adset_id))
      .map(a => {
        const ins = adInsightsMap.get(a.id) ?? {}
        return {
          ad_set_id: adSetIdMap.get(a.adset_id),
          facebook_ad_id: a.id,
          ad_name: a.name,
          status: a.status,
          spend: Number(ins.spend ?? 0),
          impressions: Number(ins.impressions ?? 0),
          clicks: Number(ins.clicks ?? 0),
          cpm: Number(ins.cpm ?? 0),
          cpc: Number(ins.cpc ?? 0),
          reach: Number(ins.reach ?? 0),
          last_synced_at: new Date().toISOString(),
        }
      })

    if (adRows.length > 0) {
      const { error } = await supabase.from('ads').upsert(adRows, { onConflict: 'facebook_ad_id' })
      if (error) throw new Error(`ads: ${error.message}`)
    }

    const totalSpend = campaignRows.reduce((sum, c) => sum + c.spend, 0)

    return new Response(JSON.stringify({
      ok: true,
      campaigns: campaignRows.length,
      adSets: adSetRows.length,
      ads: adRows.length,
      totalSpend,
      period: { since: fmt(since), until: fmt(until) },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
