// Verify ToyyibPay credentials by attempting a createBill call.
// Returns { valid: true/false, error? } without persisting anything.

import { toyyibpayProvider } from '../_shared/toyyibpay-provider.ts'
import type { ProviderContext } from '../_shared/payment-provider.ts'

const SANDBOX = Deno.env.get('TOYYIBPAY_SANDBOX') === 'true'

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
    const { secret_key, category_code } = await req.json()
    if (!secret_key || !category_code) {
      return json({ valid: false, error: 'Missing secret_key or category_code' }, 400)
    }

    const ctx: ProviderContext = {
      secretKey: secret_key,
      categoryCode: category_code,
      mode: 'merchant',
      sandbox: SANDBOX,
    }

    // Attempt a RM 1 test bill
    await toyyibpayProvider.createBill(ctx, {
      externalRef: `verify_${crypto.randomUUID()}`,
      name: 'Credential check',
      description: 'SewaKita credential verification',
      amountCents: 100,
      payerName: 'Test',
      payerEmail: 'verify@sewakita.app',
      payerPhone: '0000000000',
      returnUrl: 'https://sewakita.app',
      callbackUrl: 'https://sewakita.app',
      chargeFeeToCustomer: false,
    })

    return json({ valid: true })
  } catch (error) {
    return json({ valid: false, error: (error as Error).message })
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
