import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const FB_API = 'https://graph.facebook.com/v19.0'

const LEAD_ACTION_TYPES = ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead', 'initiate_checkout']
const PURCHASE_ACTION_TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
const LINK_CLICK_TYPES = ['link_click']
const PAGE_VIEW_TYPES = ['landing_page_view', 'offsite_conversion.fb_pixel_page_view', 'omni_landing_page_view']
const VIEW_CONTENT_TYPES = ['view_content', 'offsite_conversion.fb_pixel_view_content', 'omni_view_content']
const INITIATE_CHECKOUT_TYPES = ['initiate_checkout', 'offsite_conversion.fb_pixel_initiate_checkout', 'omni_initiated_checkout']

function countAction(actions: { action_type: string; value: string }[] | undefined, types: string[]): number {
  if (!actions) return 0
  for (const type of types) {
    const found = actions.find(a => a.action_type === type)
    if (found) return Number(found.value ?? 0)
  }
  return 0
}

async function fetchAllPages(url: string, maxPages = 40): Promise<any[]> {
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
  const accountId = settingsMap.facebook_ad_account_id?.replace(/^act_/, '')

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
      `${FB_API}/act_${accountId}/insights?level=campaign&fields=campaign_id,spend,impressions,clicks,cpm,cpc,ctr,reach,actions&time_range=${timeRange}&limit=50&access_token=${token}`
    )
    const campaignInsightsMap = new Map(campaignInsights.map(i => [i.campaign_id, i]))

    const campaignRows = campaignEntities.map(c => {
      const ins = campaignInsightsMap.get(c.id) ?? {}
      const spend = Number(ins.spend ?? 0)
      const leads = countAction(ins.actions, LEAD_ACTION_TYPES)
      const purchases = countAction(ins.actions, PURCHASE_ACTION_TYPES)
      const pageViews = countAction(ins.actions, PAGE_VIEW_TYPES)
      return {
        facebook_campaign_id: c.id,
        campaign_name: c.name,
        status: c.status,
        objective: c.objective ?? null,
        daily_budget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
        lifetime_budget: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
        spend,
        impressions: Number(ins.impressions ?? 0),
        clicks: Number(ins.clicks ?? 0),
        cpm: Number(ins.cpm ?? 0),
        cpc: Number(ins.cpc ?? 0),
        ctr: Number(ins.ctr ?? 0),
        reach: Number(ins.reach ?? 0),
        cpv: pageViews > 0 ? spend / pageViews : 0,
        cpi: leads > 0 ? spend / leads : 0,
        fb_purchases: purchases,
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

    // ── Campaign-level daily insights (para filtro real por período na tabela de Campanhas) ──
    // Buscar por-dia para as ~338 campanhas inteiras (10k+ linhas) estoura o limite de
    // recursos da Edge Function / paginacao da Meta. Restringe as campanhas com gasto
    // real no periodo (as pausadas ha mais tempo ficam com 0 nos dias filtrados, o que
    // e o comportamento correto ja que nao gastaram nada nesses dias).
    const spendingCampaignIds = campaignRows.filter(c => c.spend > 0).map(c => c.facebook_campaign_id)
    let campaignDailyRows: { campaign_id: string; date: string; spend: number; impressions: number; clicks: number; cpm: number; cpc: number; link_clicks: number; ctr: number; page_views: number; cpv: number; initiate_checkout: number; synced_at: string }[] = []
    if (spendingCampaignIds.length > 0) {
      const filtering = encodeURIComponent(JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: spendingCampaignIds }]))
      const campaignDailyInsights = await fetchAllPages(
        `${FB_API}/act_${accountId}/insights?level=campaign&fields=campaign_id,spend,impressions,clicks,cpm,cpc,inline_link_clicks,unique_ctr,actions&time_range=${timeRange}&time_increment=1&filtering=${filtering}&limit=100&access_token=${token}`,
        60
      )
      campaignDailyRows = campaignDailyInsights
        .filter(ins => campaignIdMap.has(ins.campaign_id))
        .map(ins => {
          const rowSpend = Number(ins.spend ?? 0)
          const pageViews = countAction(ins.actions, PAGE_VIEW_TYPES)
          return {
            campaign_id: campaignIdMap.get(ins.campaign_id)!,
            date: ins.date_start,
            spend: rowSpend,
            impressions: Number(ins.impressions ?? 0),
            clicks: Number(ins.clicks ?? 0),
            cpm: Number(ins.cpm ?? 0),
            cpc: Number(ins.cpc ?? 0),
            link_clicks: Number(ins.inline_link_clicks ?? 0),
            ctr: Number(ins.unique_ctr ?? 0),
            page_views: pageViews,
            cpv: pageViews > 0 ? rowSpend / pageViews : 0,
            initiate_checkout: countAction(ins.actions, INITIATE_CHECKOUT_TYPES),
            synced_at: new Date().toISOString(),
          }
        })
    }

    if (campaignDailyRows.length > 0) {
      const { error } = await supabase.from('campaign_daily_insights').upsert(campaignDailyRows, { onConflict: 'campaign_id,date' })
      if (error) throw new Error(`campaign_daily_insights: ${error.message}`)
    }

    // ── Account-level daily insights (para filtro real por período) ──
    const dailyInsights = await fetchAllPages(
      `${FB_API}/act_${accountId}/insights?fields=spend,impressions,clicks,cpm,cpc,ctr,reach,actions&time_range=${timeRange}&time_increment=1&limit=50&access_token=${token}`
    )

    const dailyRows = dailyInsights.map(ins => {
      const spend = Number(ins.spend ?? 0)
      const leads = countAction(ins.actions, LEAD_ACTION_TYPES)
      const purchases = countAction(ins.actions, PURCHASE_ACTION_TYPES)
      const pageViews = countAction(ins.actions, PAGE_VIEW_TYPES)
      return {
        date: ins.date_start,
        spend,
        impressions: Number(ins.impressions ?? 0),
        clicks: Number(ins.clicks ?? 0),
        cpm: Number(ins.cpm ?? 0),
        cpc: Number(ins.cpc ?? 0),
        ctr: Number(ins.ctr ?? 0),
        reach: Number(ins.reach ?? 0),
        cpv: pageViews > 0 ? spend / pageViews : 0,
        cpi: leads > 0 ? spend / leads : 0,
        fb_purchases: purchases,
        link_clicks: countAction(ins.actions, LINK_CLICK_TYPES),
        page_views: pageViews,
        view_content: countAction(ins.actions, VIEW_CONTENT_TYPES),
        initiate_checkout: countAction(ins.actions, INITIATE_CHECKOUT_TYPES),
        synced_at: new Date().toISOString(),
      }
    })

    if (dailyRows.length > 0) {
      const { error } = await supabase.from('fb_account_daily_insights').upsert(dailyRows, { onConflict: 'date' })
      if (error) throw new Error(`fb_account_daily_insights: ${error.message}`)
    }

    const totalSpend = campaignRows.reduce((sum, c) => sum + c.spend, 0)

    return new Response(JSON.stringify({
      ok: true,
      campaigns: campaignRows.length,
      adSets: adSetRows.length,
      ads: adRows.length,
      campaignDailyInsights: campaignDailyRows.length,
      spendingCampaigns: spendingCampaignIds.length,
      dailyInsights: dailyRows.length,
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
