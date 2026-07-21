import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

function extractFacebookAdId(utmContent: string | null | undefined): string | null {
  if (!utmContent) return null
  const parts = utmContent.split('|')
  const last = parts[parts.length - 1]?.trim()
  return last && /^\d{10,}$/.test(last) ? last : null
}

function mapStatus(paytStatus: string): 'approved' | 'pending' | 'refunded' | 'cancelled' | 'chargeback' {
  if (paytStatus === 'paid') return 'approved'
  if (paytStatus === 'refunded') return 'refunded'
  if (paytStatus === 'chargedback' || paytStatus === 'chargeback') return 'chargeback'
  if (paytStatus === 'canceled' || paytStatus === 'cancelled') return 'cancelled'
  return 'pending'
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!body?.transaction_id) {
    return new Response('Missing transaction_id', { status: 400 })
  }

  const row = {
    checkout_platform: 'payt',
    transaction_id: body.transaction_id,
    product_name: body.product?.name ?? null,
    product_id: body.product?.code ?? body.product?.sku ?? null,
    buyer_name: body.customer?.name ?? null,
    buyer_email: body.customer?.email ?? null,
    amount: (body.transaction?.total_price ?? 0) / 100,
    currency: 'BRL',
    status: mapStatus(body.status),
    payment_method: body.transaction?.payment_method ?? null,
    utm_source: body.link?.sources?.utm_source ?? null,
    utm_medium: body.link?.sources?.utm_medium ?? null,
    utm_campaign: body.link?.sources?.utm_campaign ?? null,
    utm_content: body.link?.sources?.utm_content ?? null,
    utm_term: body.link?.sources?.utm_term ?? null,
    ad_id: extractFacebookAdId(body.link?.sources?.utm_content) ?? body.link?.sources?.src ?? null,
    is_organic: !body.link?.sources?.utm_source,
    sale_date: body.transaction?.paid_at ?? body.updated_at ?? new Date().toISOString(),
    raw_webhook_data: body,
  }

  const { error } = await supabase.from('sales').upsert(row, { onConflict: 'transaction_id' })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
