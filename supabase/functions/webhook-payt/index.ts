import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

function mapStatus(paytStatus: string): 'aprovada' | 'pendente' | 'reembolsada' {
  if (paytStatus === 'paid') return 'aprovada'
  if (paytStatus === 'refunded' || paytStatus === 'chargedback' || paytStatus === 'chargeback') return 'reembolsada'
  return 'pendente'
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
    transaction_id: body.transaction_id,
    date: body.transaction?.paid_at ?? body.updated_at ?? new Date().toISOString(),
    product: body.product?.name ?? 'Produto',
    value: (body.transaction?.total_price ?? 0) / 100,
    checkout: 'Payt',
    campaign: body.link?.title ?? null,
    ad_set: body.link?.sources?.utm_source ?? null,
    ad: null,
    status: mapStatus(body.status),
    type: 'paga',
    customer_name: body.customer?.name ?? null,
    customer_email: body.customer?.email ?? null,
    raw: body,
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
