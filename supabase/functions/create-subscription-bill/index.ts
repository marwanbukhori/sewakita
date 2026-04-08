// Create a ToyyibPay bill for landlord SaaS subscription.
// Uses the PLATFORM's ToyyibPay credentials (env vars).
// Called by frontend when landlord clicks a plan card on /plans.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toyyibpayProvider } from '../_shared/toyyibpay-provider.ts'
import type { ProviderContext } from '../_shared/payment-provider.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PLATFORM_SECRET_KEY = Deno.env.get('TOYYIBPAY_SECRET_KEY')!
const PLATFORM_CATEGORY_CODE = Deno.env.get('TOYYIBPAY_CATEGORY_CODE')!
const SANDBOX = Deno.env.get('TOYYIBPAY_SANDBOX') === 'true'
const APP_URL = Deno.env.get('APP_URL') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

console.log('create-subscription-bill mode:', SANDBOX ? 'SANDBOX' : 'PRODUCTION')

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    // Authenticate the caller via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const { data: userResult } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!userResult?.user) return json({ error: 'Unauthorized' }, 401)

    // Resolve profile id (landlord_id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, phone, role')
      .eq('auth_id', userResult.user.id)
      .single()

    if (!profile || profile.role !== 'landlord') {
      return json({ error: 'Only landlords can subscribe' }, 403)
    }

    const { plan_code } = await req.json()
    if (!plan_code) return json({ error: 'Missing plan_code' }, 400)

    // Load plan
    const { data: plan } = await supabase
      .from('plans').select('*').eq('code', plan_code).eq('is_active', true).single()

    if (!plan) return json({ error: 'Plan not found' }, 404)
    if (plan.billing_interval === 'none') {
      return json({ error: 'Free plans do not require checkout' }, 400)
    }

    // Idempotency: if a past_due subscription exists for this landlord on the same plan with a fresh bill, return existing URL
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id, gateway_bill_ref')
      .eq('landlord_id', profile.id)
      .eq('plan_code', plan_code)
      .eq('status', 'past_due')
      .maybeSingle()

    if (existing?.gateway_bill_ref) {
      const host = SANDBOX ? 'https://dev.toyyibpay.com' : 'https://toyyibpay.com'
      return json({
        payment_url: `${host}/${existing.gateway_bill_ref}`,
        subscription_id: existing.id,
      })
    }

    // Cancel any other past_due subscription (user switching plans before paying)
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('landlord_id', profile.id)
      .eq('status', 'past_due')

    // Create new subscription row in past_due state
    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .insert({
        landlord_id: profile.id,
        plan_code,
        status: 'past_due',
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),  // advances on webhook success
        gateway: 'toyyibpay',
        gateway_category_code: PLATFORM_CATEGORY_CODE,
      })
      .select('id')
      .single()

    if (subErr || !sub) {
      return json({ error: 'Failed to create subscription', details: subErr?.message }, 500)
    }

    const ctx: ProviderContext = {
      secretKey: PLATFORM_SECRET_KEY,
      categoryCode: PLATFORM_CATEGORY_CODE,
      mode: 'platform',
      sandbox: SANDBOX,
    }

    const result = await toyyibpayProvider.createBill(ctx, {
      externalRef: `sub_${sub.id}`,
      name: `ReRumah ${plan.display_name}`,
      description: `Subscription: ${plan.display_name}`,
      amountCents: Math.round(Number(plan.price_myr) * 100),
      payerName: profile.name,
      payerEmail: profile.email,
      payerPhone: profile.phone || '',
      returnUrl: `${APP_URL}/plans/success?sub=${sub.id}`,
      callbackUrl: `${SUPABASE_URL}/functions/v1/toyyibpay-webhook`,
      chargeFeeToCustomer: false,  // platform absorbs the RM 1
    })

    await supabase.from('subscriptions').update({
      gateway_bill_ref: result.gatewayRef,
    }).eq('id', sub.id)

    return json({ payment_url: result.paymentUrl, subscription_id: sub.id })
  } catch (error) {
    console.error('create-subscription-bill error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
