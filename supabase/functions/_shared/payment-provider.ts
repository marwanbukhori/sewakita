// Provider-agnostic payment interface.
// Implementations (toyyibpay, future: billplz, chip) satisfy this shape.
// Pure HTTP client — no Supabase, no DB access.

export type ProviderMode = 'platform' | 'merchant'

export interface ProviderContext {
  secretKey: string
  categoryCode: string
  mode: ProviderMode         // platform = rerumah collecting, merchant = landlord collecting
  accountId?: string         // landlord's property_id in merchant mode (logging only)
  sandbox: boolean
}

export interface CreateBillParams {
  externalRef: string        // our internal id, echoed back in webhook (e.g. sub_<uuid>, rent_<uuid>)
  name: string               // bill title shown to payer
  description: string
  amountCents: number        // integer cents (RM 1.00 = 100)
  payerName: string
  payerEmail: string
  payerPhone: string
  returnUrl: string          // browser redirect after payment
  callbackUrl: string        // server webhook URL
  chargeFeeToCustomer: boolean  // true = payer absorbs gateway fee
}

export interface BillResult {
  gatewayRef: string         // provider's bill id
  paymentUrl: string
}

export type WebhookStatus = 'success' | 'pending' | 'failed'

export interface WebhookEvent {
  externalRef: string        // our id echoed from externalRef
  gatewayRef: string         // provider's bill id
  status: WebhookStatus
  amountCents: number
}

export interface BillStatusResult {
  gatewayRef: string
  status: WebhookStatus
  amountCents: number
}

export interface PaymentProvider {
  name: string
  createBill(ctx: ProviderContext, params: CreateBillParams): Promise<BillResult>
  parseWebhook(payload: FormData | URLSearchParams | Record<string, string>): WebhookEvent
  getBillStatus(ctx: ProviderContext, gatewayRef: string): Promise<BillStatusResult>
}
