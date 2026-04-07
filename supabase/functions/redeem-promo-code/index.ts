// Redeem a promo code to get a Pro subscription
// Deploy: supabase functions deploy redeem-promo-code

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Get landlord from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'code_required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Look up promo code
    const { data: promo, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single()

    if (promoError || !promo) {
      return new Response(JSON.stringify({ success: false, error: 'code_invalid' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: 'code_expired' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check usage limit
    if (promo.current_uses >= promo.max_uses) {
      return new Response(JSON.stringify({ success: false, error: 'code_exhausted' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if user already has active Pro
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('landlord_id', user.id)
      .in('status', ['active', 'past_due'])
      .single()

    if (existingSub && existingSub.plan_code !== 'free') {
      return new Response(JSON.stringify({ success: false, error: 'already_pro' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create subscription
    const periodEnd = promo.permanent ? '2099-12-31T23:59:59Z' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: subError } = await supabase.from('subscriptions').insert({
      landlord_id: user.id,
      plan_code: promo.plan_code,
      status: 'active',
      period_start: new Date().toISOString(),
      period_end: periodEnd,
      gateway: null,
      gateway_bill_ref: null,
      gateway_category_code: null,
    })

    if (subError) {
      console.error('Subscription insert error:', subError)
      return new Response(JSON.stringify({ success: false, error: 'subscription_failed' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Increment usage
    await supabase.from('promo_codes').update({
      current_uses: promo.current_uses + 1,
    }).eq('id', promo.id)

    // Log activity
    await supabase.from('activity_log').insert({
      landlord_id: user.id,
      type: 'promo_redeemed',
      title: `Promo code ${promo.code} redeemed`,
      detail: JSON.stringify({ code: promo.code, plan: promo.plan_code, permanent: promo.permanent }),
    })

    return new Response(JSON.stringify({
      success: true,
      plan: promo.plan_code,
      permanent: promo.permanent,
      remaining: promo.max_uses - promo.current_uses - 1,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('redeem-promo-code error:', err)
    return new Response(JSON.stringify({ success: false, error: 'internal_error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
