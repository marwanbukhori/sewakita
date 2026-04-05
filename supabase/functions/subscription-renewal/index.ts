// Daily subscription renewal cron.
// Steps (in order):
//   1. Monthly subs active + ending within 1 day → create next bill, set past_due, email link
//   2. past_due > 7 days → dunning email #2
//   3. past_due > 14 days → expire, create new free sub, downgrade email
//   4. Annual subs active + ending in 13-15 days → T-14 reminder
//      Also T-3 (2-4 days) and T-0 (today) reminders
// Deploy: supabase functions deploy subscription-renewal
// Schedule via Supabase Dashboard Cron Jobs: 0 1 * * * (9am MYT = 1am UTC)

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

Deno.serve(async (_req) => {
  const summary = { renewed: 0, dunned: 0, expired: 0, t14: 0, t3: 0, t0: 0, errors: [] as string[] }

  // --- Step 1: Monthly renewals (active, ending ≤ 1 day) ---
  const { data: toRenew } = await supabase
    .from('subscriptions')
    .select('id, landlord_id, plan_code, period_end, plan:plans(price_myr, display_name, billing_interval)')
    .eq('status', 'active')
    .like('plan_code', '%_monthly')
    .lte('period_end', new Date(Date.now() + 86400000).toISOString())

  for (const sub of (toRenew || [])) {
    try {
      await renewMonthly(sub)
      summary.renewed++
    } catch (e) {
      summary.errors.push(`renew ${sub.id}: ${(e as Error).message}`)
    }
  }

  // --- Step 2: Dunning at day 7 ---
  const { data: toDun } = await supabase
    .from('subscriptions')
    .select('id, landlord_id, plan_code, period_end')
    .eq('status', 'past_due')
    .lt('period_end', new Date(Date.now() - 7 * 86400000).toISOString())
    .gt('period_end', new Date(Date.now() - 14 * 86400000).toISOString())

  for (const sub of (toDun || [])) {
    await sendEmail(sub.landlord_id, 'subscription-dunning', { plan_code: sub.plan_code, days_past: 7 })
    summary.dunned++
  }

  // --- Step 3: Expire at day 14 + create free sub ---
  const { data: toExpire } = await supabase
    .from('subscriptions')
    .select('id, landlord_id')
    .eq('status', 'past_due')
    .lt('period_end', new Date(Date.now() - 14 * 86400000).toISOString())

  for (const sub of (toExpire || [])) {
    try {
      await supabase.from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', sub.id)
      // Create new free subscription (far-future period_end)
      await supabase.from('subscriptions').insert({
        landlord_id: sub.landlord_id,
        plan_code: 'free',
        status: 'active',
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 365 * 86400000 * 10).toISOString(),
      })
      await sendEmail(sub.landlord_id, 'subscription-expired', {})
      summary.expired++
    } catch (e) {
      summary.errors.push(`expire ${sub.id}: ${(e as Error).message}`)
    }
  }

  // --- Step 4: Annual reminders ---
  // T-14
  const { data: annualT14 } = await supabase
    .from('subscriptions')
    .select('id, landlord_id, plan_code, period_end')
    .eq('status', 'active')
    .like('plan_code', '%_annual')
    .gte('period_end', new Date(Date.now() + 13 * 86400000).toISOString())
    .lt('period_end', new Date(Date.now() + 15 * 86400000).toISOString())
  for (const sub of (annualT14 || [])) {
    await sendEmail(sub.landlord_id, 'subscription-annual-reminder', { plan_code: sub.plan_code, days_out: 14, period_end: sub.period_end })
    summary.t14++
  }

  // T-3
  const { data: annualT3 } = await supabase
    .from('subscriptions')
    .select('id, landlord_id, plan_code, period_end')
    .eq('status', 'active')
    .like('plan_code', '%_annual')
    .gte('period_end', new Date(Date.now() + 2 * 86400000).toISOString())
    .lt('period_end', new Date(Date.now() + 4 * 86400000).toISOString())
  for (const sub of (annualT3 || [])) {
    await sendEmail(sub.landlord_id, 'subscription-annual-reminder', { plan_code: sub.plan_code, days_out: 3, period_end: sub.period_end })
    summary.t3++
  }

  // T-0
  const { data: annualT0 } = await supabase
    .from('subscriptions')
    .select('id, landlord_id, plan_code, period_end')
    .eq('status', 'active')
    .like('plan_code', '%_annual')
    .gte('period_end', new Date().toISOString())
    .lt('period_end', new Date(Date.now() + 86400000).toISOString())
  for (const sub of (annualT0 || [])) {
    await sendEmail(sub.landlord_id, 'subscription-annual-reminder', { plan_code: sub.plan_code, days_out: 0, period_end: sub.period_end })
    summary.t0++
  }

  console.log('subscription-renewal summary:', summary)
  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// --- Helpers ---

async function renewMonthly(sub: { id: string; landlord_id: string; plan_code: string; period_end: string; plan: { price_myr: number; display_name: string } | { price_myr: number; display_name: string }[] | null }) {
  const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan
  if (!plan) throw new Error('plan missing')

  // Load landlord for payer info
  const { data: profile } = await supabase
    .from('profiles').select('name, email, phone').eq('id', sub.landlord_id).single()
  if (!profile) throw new Error('profile missing')

  // Set current sub to past_due first
  await supabase.from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('id', sub.id)

  // Create fresh ToyyibPay bill for this subscription
  const ctx: ProviderContext = {
    secretKey: PLATFORM_SECRET_KEY,
    categoryCode: PLATFORM_CATEGORY_CODE,
    mode: 'platform',
    sandbox: SANDBOX,
  }

  const result = await toyyibpayProvider.createBill(ctx, {
    externalRef: `sub_${sub.id}`,
    name: `SewaKita ${plan.display_name}`,
    description: `Monthly renewal: ${plan.display_name}`,
    amountCents: Math.round(Number(plan.price_myr) * 100),
    payerName: profile.name,
    payerEmail: profile.email,
    payerPhone: profile.phone || '',
    returnUrl: `${APP_URL}/plans/success?sub=${sub.id}`,
    callbackUrl: `${SUPABASE_URL}/functions/v1/toyyibpay-webhook`,
    chargeFeeToCustomer: false,
  })

  await supabase.from('subscriptions').update({
    gateway_bill_ref: result.gatewayRef,
  }).eq('id', sub.id)

  await sendEmail(sub.landlord_id, 'subscription-renewal', {
    plan_code: sub.plan_code,
    payment_url: result.paymentUrl,
    amount: plan.price_myr,
  })
}

async function sendEmail(landlord_id: string, template: string, data: Record<string, unknown>) {
  const { data: profile } = await supabase
    .from('profiles').select('name, email').eq('id', landlord_id).single()
  if (!profile?.email) return
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.email,
        template,
        language: 'en',
        landlord_id,
        data: { landlord_name: profile.name, ...data },
      }),
    })
  } catch { /* don't fail the cron over email */ }
}
