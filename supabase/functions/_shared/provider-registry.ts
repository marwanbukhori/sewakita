// Single entry point for resolving a payment provider by name.
// Add new providers (billplz, chip) here when SSM is obtained.

import type { PaymentProvider } from './payment-provider.ts'
import { toyyibpayProvider } from './toyyibpay-provider.ts'

export function getProvider(gateway: string): PaymentProvider {
  switch (gateway) {
    case 'toyyibpay':
      return toyyibpayProvider
    default:
      throw new Error(`Unknown payment gateway: ${gateway}`)
  }
}
