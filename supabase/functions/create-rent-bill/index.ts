// Create a ToyyibPay bill for tenant rent payment.
// Uses the landlord's own ToyyibPay credentials (merchant context).
// Called by frontend when tenant clicks "Pay Now".

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toyyibpayProvider } from '../_shared/toyyibpay-provider.ts'
import type { ProviderContext } from '../_shared/payment-provider.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const SANDBOX = Deno.env.get('TOYYIBPAY_SANDBOX') === 'true'
const APP_URL = Deno.env.get('APP_URL') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

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
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() })
  }

  try {
    const { bill_id, amount, tenant_email, tenant_name, description, redirect_url } = await req.json()

    if (!bill_id || !amount || !tenant_email || !tenant_name) {
      return json({ error: 'Missing required fields' }, 400)
    }

    // Load the monthly bill to get property_id
    const { data: bill } = await supabase
      .from('monthly_bills')
      .select('id, property_id, tenant_id')
      .eq('id', bill_id)
      .single()

    if (!bill) return json({ error: 'Bill not found' }, 404)

    // Load landlord's payment settings for this property
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('gateway, gateway_category_code, gateway_secret_key_encrypted')
      .eq('property_id', bill.property_id)
      .single()

    if (!settings?.gateway_category_code || !settings?.gateway_secret_key_encrypted) {
      return json({
        error: 'gateway_not_configured',
        message: 'Landlord has not set up online payment yet',
      }, 400)
    }

    const secretKey = atob(settings.gateway_secret_key_encrypted)

    // Get tenant phone for payer info
    const { data: tenant } = await supabase
      .from('profiles').select('phone').eq('id', bill.tenant_id).single()

    // Pre-create payment row so we have an id to use as externalRef
    const { data: payment, error: paymentErr } = await supabase.from('payments').insert({
      bill_id,
      amount,
      date: new Date().toISOString().split('T')[0],
      method: 'duitnow',
      receipt_sent: false,
      gateway: settings.gateway,
      gateway_status: 'pending',
    }).select('id').single()

    if (paymentErr || !payment) {
      return json({ error: 'Failed to create payment record', details: paymentErr?.message }, 500)
    }

    const ctx: ProviderContext = {
      secretKey,
      categoryCode: settings.gateway_category_code,
      mode: 'merchant',
      accountId: bill.property_id,
      sandbox: SANDBOX,
    }

    const result = await toyyibpayProvider.createBill(ctx, {
      externalRef: `rent_${payment.id}`,
      name: `Rent ${description || ''}`.slice(0, 30),
      description: description || `ReRumah rent payment`,
      amountCents: Math.round(Number(amount) * 100),
      payerName: tenant_name,
      payerEmail: tenant_email,
      payerPhone: tenant?.phone || '',
      returnUrl: redirect_url || `${APP_URL}/tenant/payment-success`,
      callbackUrl: `${SUPABASE_URL}/functions/v1/toyyibpay-webhook`,
      chargeFeeToCustomer: true,  // tenants absorb the RM 1 FPX fee
    })

    // Write gateway refs back to payment row
    await supabase.from('payments').update({
      gateway_bill_id: result.gatewayRef,
      gateway_url: result.paymentUrl,
    }).eq('id', payment.id)

    return json({ payment_url: result.paymentUrl, billcode: result.gatewayRef })
  } catch (error) {
    console.error('create-rent-bill error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
