// Billplz adapter implementing PaymentProvider.
// API reference: https://www.billplz.com/api
// Sandbox: https://www.billplz-sandbox.com | Production: https://www.billplz.com

import type {
  PaymentProvider,
  ProviderContext,
  CreateBillParams,
  BillResult,
  WebhookEvent,
  BillStatusResult,
} from './payment-provider.ts'

const PROD_HOST = 'https://www.billplz.com/api'
const SANDBOX_HOST = 'https://www.billplz-sandbox.com/api'

function baseUrl(ctx: ProviderContext): string {
  return ctx.sandbox ? SANDBOX_HOST : PROD_HOST
}

function authHeader(ctx: ProviderContext): string {
  return `Basic ${btoa(ctx.secretKey + ':')}`
}

/** Format Malaysian phone to +60xxxxxxxxx (Billplz requirement) */
function formatPhone(phone: string): string {
  const digits = phone.replace(/[\s\-()]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('60')) return `+${digits}`
  if (digits.startsWith('0')) return `+60${digits.slice(1)}`
  return `+60${digits}`
}

/**
 * Verify Billplz x_signature HMAC-SHA256.
 * Source string: sorted params joined as "key1value1|key2value2|..."
 */
export async function verifyXSignature(
  params: Record<string, string>,
  xSignature: string,
  xSignatureKey: string,
): Promise<boolean> {
  const sorted = Object.keys(params)
    .filter(k => k !== 'x_signature')
    .sort()
  const source = sorted.map(k => `${k}${params[k]}`).join('|')

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(xSignatureKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(source))
  const computed = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison
  if (computed.length !== xSignature.length) return false
  const a = encoder.encode(computed)
  const b = encoder.encode(xSignature)
  return crypto.subtle.timingSafeEqual(a, b)
}

export const billplzProvider: PaymentProvider = {
  name: 'billplz',

  async createBill(ctx: ProviderContext, params: CreateBillParams): Promise<BillResult> {
    const url = `${baseUrl(ctx)}/v3/bills`

    const body = new URLSearchParams({
      collection_id: ctx.categoryCode,
      description: params.name.slice(0, 200),
      amount: String(params.amountCents),
      name: params.payerName.slice(0, 255),
      email: params.payerEmail,
      mobile: formatPhone(params.payerPhone),
      callback_url: params.callbackUrl,
      redirect_url: params.returnUrl,
      reference_1_label: 'Ref',
      reference_1: params.externalRef.slice(0, 120),
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': authHeader(ctx) },
      body,
    })

    const bill = await res.json()
    if (!res.ok || !bill.id) {
      throw new Error(`Billplz createBill failed (${res.status}): ${JSON.stringify(bill)}`)
    }

    return {
      gatewayRef: bill.id as string,
      paymentUrl: bill.url as string,
    }
  },

  parseWebhook(payload): WebhookEvent {
    const get = (k: string): string => {
      if (payload instanceof FormData) return String(payload.get(k) ?? '')
      if (payload instanceof URLSearchParams) return payload.get(k) ?? ''
      return String((payload as Record<string, string>)[k] ?? '')
    }

    const paid = get('paid') === 'true'
    return {
      externalRef: get('reference_1'),
      gatewayRef: get('id'),
      status: paid ? 'success' : 'pending',
      amountCents: parseInt(get('paid_amount') || get('amount') || '0', 10),
    }
  },

  async getBillStatus(ctx: ProviderContext, gatewayRef: string): Promise<BillStatusResult> {
    const url = `${baseUrl(ctx)}/v3/bills/${gatewayRef}`
    const res = await fetch(url, {
      headers: { 'Authorization': authHeader(ctx) },
    })

    if (!res.ok) {
      return { gatewayRef, status: 'pending', amountCents: 0 }
    }

    const bill = await res.json()
    return {
      gatewayRef: bill.id as string,
      status: bill.paid ? 'success' : (bill.state === 'due' ? 'pending' : 'failed'),
      amountCents: parseInt(String(bill.paid_amount || bill.amount || '0'), 10),
    }
  },
}
