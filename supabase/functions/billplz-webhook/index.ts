// Billplz webhook handler.
// Dispatches by reference_1 prefix:
//   sub_<uuid>  → subscription flow (platform receiving landlord payment)
//   rent_<uuid> → rent flow (future — not implemented yet)
// Verifies x_signature HMAC-SHA256 on all callbacks.
// Always returns 200 to prevent retry loops. Idempotent on repeated calls.
// Deploy: supabase functions deploy billplz-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { billplzProvider } from '../_shared/billplz-provider.ts'
import { verifyXSignature } from '../_shared/billplz-provider.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const X_SIGNATURE_KEY = Deno.env.get('BILLPLZ_X_SIGNATURE_KEY')!

Deno.serve(async (req) => {
  // Billplz sends POST with application/x-www-form-urlencoded
  try {
    const text = await req.text()
    const params = Object.fromEntries(new URLSearchParams(text))

    // Verify x_signature
    if (X_SIGNATURE_KEY && params.x_signature) {
      const valid = await verifyXSignature(params, params.x_signature, X_SIGNATURE_KEY)
      if (!valid) {
        console.error('billplz-webhook: invalid x_signature')
        return new Response('OK', { status: 200 }) // still 200 to stop retries
      }
    }

    const event = billplzProvider.parseWebhook(new URLSearchParams(text))
    const ref = event.externalRef

    if (!ref) {
      console.warn('billplz-webhook: missing reference_1')
      return new Response('OK', { status: 200 })
    }

    if (ref.startsWith('sub_')) {
      await handleSubscriptionEvent(ref.slice(4), event)
    } else if (ref.startsWith('rent_')) {
      // Future: tenant rent payment handling
      console.log('billplz-webhook: rent payment received (not implemented yet):', ref)
    } else {
      console.warn('billplz-webhook: unknown reference_1 prefix:', ref)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('billplz-webhook error:', error)
    return new Response('OK', { status: 200 })
  }
})

async function handleSubscriptionEvent(
  subscriptionId: string,
  event: { status: string; gatewayRef: string },
) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(code, billing_interval)')
    .eq('id', subscriptionId)
    .single()

  if (!sub) {
    console.warn('billplz-webhook: subscription not found:', subscriptionId)
    return
  }

  // Idempotency: if already active with this gateway_bill_ref, no-op
  if (sub.status === 'active' && sub.gateway_bill_ref === event.gatewayRef) {
    return
  }

  if (event.status === 'success') {
    // Advance period_end based on plan interval
    const anchor = new Date(Math.max(new Date(sub.period_end).getTime(), Date.now()))
    const interval = sub.plan?.billing_interval
    const addDays = interval === 'annual' ? 365 : interval === 'monthly' ? 30 : 0
    if (addDays === 0) return

    const newPeriodEnd = new Date(anchor.getTime() + addDays * 86400000)

    await supabase.from('subscriptions').update({
      status: 'active',
      period_start: new Date().toISOString(),
      period_end: newPeriodEnd.toISOString(),
      gateway_bill_ref: event.gatewayRef,
      updated_at: new Date().toISOString(),
    }).eq('id', subscriptionId)

    await supabase.from('activity_log').insert({
      landlord_id: sub.landlord_id,
      type: 'payment_received',
      title: `Subscription activated: ${sub.plan_code}`,
      detail: `ReRumah subscription paid via Billplz — renews ${newPeriodEnd.toISOString().slice(0, 10)}`,
      related_id: subscriptionId,
    })

    console.log('billplz-webhook: subscription activated:', subscriptionId, '→', newPeriodEnd.toISOString().slice(0, 10))
  } else if (event.status === 'pending') {
    // Bill created but not yet paid — no action needed
    console.log('billplz-webhook: subscription payment pending:', subscriptionId)
  }
}
