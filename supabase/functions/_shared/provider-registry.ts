// Single entry point for resolving a payment provider by name.

import type { PaymentProvider } from './payment-provider.ts'
import { toyyibpayProvider } from './toyyibpay-provider.ts'
import { billplzProvider } from './billplz-provider.ts'

export function getProvider(gateway: string): PaymentProvider {
  switch (gateway) {
    case 'toyyibpay':
      return toyyibpayProvider
    case 'billplz':
      return billplzProvider
    default:
      throw new Error(`Unknown payment gateway: ${gateway}`)
  }
}
