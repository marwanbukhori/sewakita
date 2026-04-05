// ToyyibPay adapter implementing PaymentProvider.
// API reference: https://toyyibpay.com/apireference/
// Sandbox: https://dev.toyyibpay.com | Production: https://toyyibpay.com

import type {
  PaymentProvider,
  ProviderContext,
  CreateBillParams,
  BillResult,
  WebhookEvent,
  WebhookStatus,
  BillStatusResult,
} from './payment-provider.ts'

const PROD_HOST = 'https://toyyibpay.com'
const SANDBOX_HOST = 'https://dev.toyyibpay.com'

function baseUrl(ctx: ProviderContext): string {
  return ctx.sandbox ? SANDBOX_HOST : PROD_HOST
}

function mapStatus(statusId: string): WebhookStatus {
  // ToyyibPay: 1 = success, 2 = pending, 3 = fail
  if (statusId === '1') return 'success'
  if (statusId === '2') return 'pending'
  return 'failed'
}

async function postForm(url: string, body: Record<string, string>): Promise<any> {
  const form = new URLSearchParams(body)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`ToyyibPay non-JSON response (${res.status}): ${text.slice(0, 200)}`)
  }
}

export const toyyibpayProvider: PaymentProvider = {
  name: 'toyyibpay',

  async createBill(ctx: ProviderContext, params: CreateBillParams): Promise<BillResult> {
    const host = baseUrl(ctx)
    const res = await postForm(`${host}/index.php/api/createBill`, {
      userSecretKey: ctx.secretKey,
      categoryCode: ctx.categoryCode,
      billName: params.name.slice(0, 30),            // ToyyibPay limit: 30 chars
      billDescription: params.description.slice(0, 100),  // limit: 100 chars
      billPriceSetting: '1',                          // 1 = fixed amount
      billPayorInfo: '1',                             // collect payer info
      billAmount: String(params.amountCents),
      billReturnUrl: params.returnUrl,
      billCallbackUrl: params.callbackUrl,
      billExternalReferenceNo: params.externalRef,
      billTo: params.payerName,
      billEmail: params.payerEmail,
      billPhone: params.payerPhone,
      billPaymentChannel: '0',                        // 0 = FPX + card
      billChargeToCustomer: params.chargeFeeToCustomer ? '1' : '0',
    })

    // Success response: [{ BillCode: "abc123" }]
    if (!Array.isArray(res) || !res[0]?.BillCode) {
      throw new Error(`ToyyibPay createBill failed: ${JSON.stringify(res)}`)
    }
    const billCode = res[0].BillCode
    return {
      gatewayRef: billCode,
      paymentUrl: `${host}/${billCode}`,
    }
  },

  parseWebhook(payload): WebhookEvent {
    const get = (k: string): string => {
      if (payload instanceof FormData) return String(payload.get(k) ?? '')
      if (payload instanceof URLSearchParams) return payload.get(k) ?? ''
      return String((payload as Record<string, string>)[k] ?? '')
    }

    return {
      externalRef: get('order_id'),
      gatewayRef: get('billcode'),
      status: mapStatus(get('status')),
      amountCents: parseInt(get('amount') || '0', 10),
    }
  },

  async getBillStatus(ctx: ProviderContext, gatewayRef: string): Promise<BillStatusResult> {
    const host = baseUrl(ctx)
    const res = await postForm(`${host}/index.php/api/getBillTransactions`, {
      billCode: gatewayRef,
    })

    // Response: array of transactions, newest first
    if (!Array.isArray(res) || res.length === 0) {
      return { gatewayRef, status: 'pending', amountCents: 0 }
    }
    const tx = res[0]
    // billpaymentStatus: 1 = success, 2 = pending, 3 = fail
    return {
      gatewayRef,
      status: mapStatus(String(tx.billpaymentStatus ?? '2')),
      amountCents: parseInt(String(tx.billpaymentAmount ?? '0'), 10),
    }
  },
}
