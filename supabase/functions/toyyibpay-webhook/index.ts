// Unified ToyyibPay webhook handler.
// Dispatches by billExternalReferenceNo prefix:
//   sub_<uuid>  → subscription flow (platform receiving landlord payment)
//   rent_<uuid> → rent flow (landlord receiving tenant payment)
// Always returns 200 to prevent retry loops. Idempotent on repeated calls.
// Deploy: supabase functions deploy toyyibpay-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toyyibpayProvider } from '../_shared/toyyibpay-provider.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const formData = await req.formData()
    const event = toyyibpayProvider.parseWebhook(formData)
    const ref = event.externalRef

    if (!ref) return new Response('Missing order_id', { status: 200 })

    if (ref.startsWith('sub_')) {
      await handleSubscriptionEvent(ref.slice(4), event)
    } else if (ref.startsWith('rent_')) {
      await handleRentEvent(ref.slice(5), event)
    } else {
      console.warn('Unknown externalRef prefix:', ref)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('toyyibpay-webhook error:', error)
    return new Response('OK', { status: 200 })
  }
})

async function handleSubscriptionEvent(subscriptionId: string, event: { status: string; gatewayRef: string }) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(code, billing_interval)')
    .eq('id', subscriptionId)
    .single()

  if (!sub) {
    console.warn('Subscription not found:', subscriptionId)
    return
  }

  // Idempotency: if already active with this gateway_bill_ref, no-op
  if (sub.status === 'active' && sub.gateway_bill_ref === event.gatewayRef) {
    return
  }

  if (event.status === 'success') {
    // Advance period_end based on plan interval, from current period_end (or now if past)
    const anchor = new Date(Math.max(new Date(sub.period_end).getTime(), Date.now()))
    const interval = sub.plan?.billing_interval
    const addDays = interval === 'annual' ? 365 : interval === 'monthly' ? 30 : 0
    if (addDays === 0) return  // free/trial plans shouldn't go through checkout

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
      detail: `ReRumah subscription paid — renews ${newPeriodEnd.toISOString().slice(0, 10)}`,
      related_id: subscriptionId,
    })
  } else if (event.status === 'failed') {
    // Keep status as past_due so the user can retry or pick a different plan
    console.log('Subscription payment failed:', subscriptionId)
  }
}

async function handleRentEvent(paymentId: string, event: { status: string; gatewayRef: string; amountCents: number }) {
  const { data: payment } = await supabase
    .from('payments')
    .select('*, monthly_bill:monthly_bills(*)')
    .eq('id', paymentId)
    .single()

  if (!payment) {
    console.warn('Payment not found:', paymentId)
    return
  }

  // Idempotency: already paid
  if (payment.gateway_status === 'paid') return

  if (event.status === 'success') {
    await supabase.from('payments').update({
      gateway_status: 'paid',
    }).eq('id', payment.id)

    const bill = payment.monthly_bill
    if (!bill) return

    const newTotalPaid = Number(bill.total_paid) + Number(payment.amount)
    await supabase.from('monthly_bills').update({
      total_paid: newTotalPaid,
      status: newTotalPaid >= Number(bill.total_due) ? 'paid' : 'partial',
    }).eq('id', bill.id)

    // Activity log + receipt email
    const { data: property } = await supabase
      .from('properties')
      .select('landlord_id, name')
      .eq('id', bill.property_id)
      .single()

    if (!property) return

    await supabase.from('activity_log').insert({
      landlord_id: property.landlord_id,
      type: 'payment_received',
      title: `Payment received: RM${payment.amount}`,
      detail: `${property.name} — Online payment via ToyyibPay`,
      related_id: payment.id,
    })

    const { data: tenant } = await supabase
      .from('profiles').select('name, email').eq('id', bill.tenant_id).single()
    const { data: room } = await supabase
      .from('rooms').select('label').eq('id', bill.room_id).single()

    if (tenant?.email) {
      const { data: notifSettings } = await supabase
        .from('notification_settings').select('email_enabled, on_payment_received')
        .eq('property_id', bill.property_id).single()

      if (!notifSettings || (notifSettings.email_enabled && notifSettings.on_payment_received)) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: tenant.email,
              template: 'receipt',
              language: 'en',
              tenant_id: bill.tenant_id,
              property_id: bill.property_id,
              data: {
                tenant_name: tenant.name,
                property_name: property.name,
                room_label: room?.label,
                month: bill.month,
                amount: payment.amount,
                status: newTotalPaid >= Number(bill.total_due) ? 'paid' : 'partial',
              },
            }),
          })
        } catch { /* don't block on email failure */ }
      }
    }
  } else if (event.status === 'failed') {
    await supabase.from('payments').update({
      gateway_status: 'failed',
    }).eq('id', payment.id)
  }
}
