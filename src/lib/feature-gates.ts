export const ONLINE_PAYMENTS_ENABLED = import.meta.env.VITE_ENABLE_ONLINE_PAYMENTS === 'true'

export type PlanTier = 'free' | 'pro'

export function getPlanTier(planCode: string | null | undefined): PlanTier {
  if (!planCode || planCode === 'free') return 'free'
  return 'pro'
}

export function canAddProperty(tier: PlanTier, currentCount: number): boolean {
  if (tier === 'free') return currentCount < 1
  return true
}

export function hasReports(tier: PlanTier): boolean {
  return tier === 'pro'
}

export function hasOnlinePayments(tier: PlanTier): boolean {
  return ONLINE_PAYMENTS_ENABLED && tier === 'pro'
}

export function hasOCR(tier: PlanTier): boolean {
  return tier === 'pro'
}
