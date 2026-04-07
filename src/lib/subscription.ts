import { supabase } from './supabase'

export interface Plan {
  code: string
  display_name: string
  price_myr: number
  billing_interval: 'none' | 'monthly' | 'annual'
  is_active: boolean
  sort_order: number
}

export interface Subscription {
  id: string
  landlord_id: string
  plan_code: string
  status: 'active' | 'past_due' | 'expired' | 'cancelled'
  period_start: string
  period_end: string
  gateway: string | null
  gateway_bill_ref: string | null
  gateway_category_code: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan
}

export async function getActiveSubscription(landlord_id: string): Promise<SubscriptionWithPlan | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('landlord_id', landlord_id)
    .in('status', ['active', 'past_due'])
    .maybeSingle()
  return data as SubscriptionWithPlan | null
}

export async function listPlans(): Promise<Plan[]> {
  const { data } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .neq('code', 'free')  // free isn't selectable — it's the default
    .order('sort_order', { ascending: true })
  return (data || []) as Plan[]
}

export function daysUntil(dateIso: string): number {
  const ms = new Date(dateIso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
}

export async function getCurrentPlanCode(landlordId: string): Promise<string | null> {
  const sub = await getActiveSubscription(landlordId)
  return sub?.plan_code || null
}

export function formatPeriodRemaining(dateIso: string): string {
  const days = daysUntil(dateIso)
  if (days === 0) return 'expires today'
  if (days === 1) return '1 day remaining'
  if (days < 30) return `${days} days remaining`
  const d = new Date(dateIso)
  return `renews ${d.toISOString().slice(0, 10)}`
}
