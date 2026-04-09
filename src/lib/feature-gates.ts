export const SUBSCRIPTION_PAYMENTS_ENABLED = import.meta.env.VITE_ENABLE_SUBSCRIPTION_PAYMENTS === 'true'
export const TENANT_PAYMENTS_ENABLED = import.meta.env.VITE_ENABLE_TENANT_PAYMENTS === 'true'

export type PlanTier = 'free' | 'pro'

export function getPlanTier(planCode: string | null | undefined): PlanTier {
  if (!planCode || planCode === 'free') return 'free'
  return 'pro'
}

export function canAddProperty(tier: PlanTier, currentCount: number, config?: { free_property_limit?: number }): boolean {
  if (tier === 'free') return currentCount < (config?.free_property_limit ?? 1)
  return true
}

export function hasReports(tier: PlanTier): boolean {
  return tier === 'pro'
}

export function hasTenantPayments(tier: PlanTier): boolean {
  return TENANT_PAYMENTS_ENABLED && tier === 'pro'
}

export function hasOCR(tier: PlanTier): boolean {
  return tier === 'pro'
}
