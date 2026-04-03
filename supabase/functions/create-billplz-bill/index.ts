// Create a Billplz bill for tenant payment
// Called by frontend when tenant clicks "Pay Now"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BILLPLZ_API_KEY = Deno.env.get('BILLPLZ_API_KEY')!
const BILLPLZ_SANDBOX = Deno.env.get('BILLPLZ_SANDBOX') === 'true'
const BILLPLZ_BASE_URL = BILLPLZ_SANDBOX
  ? 'https://www.billplz-sandbox.com/api/v3'
  : 'https://www.billplz.com/api/v3'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { bill_id, amount, tenant_email, tenant_name, description, redirect_url, callback_url } = await req.json()

    if (!bill_id || !amount || !tenant_email || !tenant_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Get collection ID from payment_settings
    const { data: bill } = await supabase
      .from('monthly_bills')
      .select('*, property:properties(id)')
      .eq('id', bill_id)
      .single()

    if (!bill) {
      return new Response(JSON.stringify({ error: 'Bill not found' }), { status: 404 })
    }

    const { data: settings } = await supabase
      .from('payment_settings')
      .select('billplz_collection_id')
      .eq('property_id', bill.property_id)
      .single()

    const collectionId = settings?.billplz_collection_id || Deno.env.get('BILLPLZ_COLLECTION_ID')
    if (!collectionId) {
      return new Response(JSON.stringify({ error: 'No Billplz collection configured' }), { status: 400 })
    }

    // Create Billplz bill
    const amountInCents = Math.round(amount * 100)
    const billplzResponse = await fetch(`${BILLPLZ_BASE_URL}/bills`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(BILLPLZ_API_KEY + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection_id: collectionId,
        email: tenant_email,
        name: tenant_name,
        amount: amountInCents,
        description: description || `SewaKita rent payment`,
        callback_url: callback_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/billplz-webhook`,
        redirect_url: redirect_url || `${Deno.env.get('APP_URL')}/tenant/payment-success`,
      }),
    })

    const billplzData = await billplzResponse.json()

    if (!billplzResponse.ok) {
      return new Response(JSON.stringify({ error: 'Billplz API error', details: billplzData }), { status: 500 })
    }

    // Create payment record with gateway info
    await supabase.from('payments').insert({
      bill_id,
      amount,
      date: new Date().toISOString().split('T')[0],
      method: 'duitnow',
      receipt_sent: false,
      gateway: 'billplz',
      gateway_bill_id: billplzData.id,
      gateway_url: billplzData.url,
      gateway_status: 'pending',
    })

    return new Response(JSON.stringify({
      payment_url: billplzData.url,
      billplz_bill_id: billplzData.id,
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})
