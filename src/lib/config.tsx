import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export interface AppConfig {
  config: Record<string, unknown>
  flags: Record<string, { enabled: boolean; tier: string }>
  plans: Array<{ code: string; display_name: string; price_myr: string; billing_interval: string; is_active: boolean; sort_order: number }>
  loading: boolean
}

// Hardcoded defaults — mirrors Phase 1 seed values. Used if fetch fails.
const DEFAULTS: Omit<AppConfig, 'loading'> = {
  config: {
    free_property_limit: 1,
    dunning_days: 7,
    expiry_days: 14,
    overdue_reminder_cooldown_days: 7,
    overdue_reminder_intervals: [1, 3, 5, 7],
    promo_period_days: 30,
    renewal_period_monthly_days: 30,
    renewal_period_annual_days: 365,
    free_features: ['1 property', 'Bill generation & WhatsApp', 'Manual payment recording'],
    pro_features: ['Unlimited properties', 'Online payment (FPX)', 'Reports & analytics', 'OCR bill scanning', 'PDF export', 'Priority support'],
    announcement_slides: [],
  },
  flags: {},
  plans: [],
}

const ConfigContext = createContext<AppConfig>({ ...DEFAULTS, loading: true })

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppConfig>({ ...DEFAULTS, loading: true })

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/get-public-config`)
      .then(r => r.json())
      .then(data => {
        setState({
          config: data.config ?? DEFAULTS.config,
          flags: data.flags ?? DEFAULTS.flags,
          plans: data.plans ?? DEFAULTS.plans,
          loading: false,
        })
      })
      .catch(() => {
        // Graceful degradation — use hardcoded defaults
        setState({ ...DEFAULTS, loading: false })
      })
  }, [])

  return (
    <ConfigContext.Provider value={state}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig(): AppConfig {
  return useContext(ConfigContext)
}

export function usePlanPrice(interval: 'monthly' | 'annual'): number {
  const { plans } = useConfig()
  const plan = plans.find(p => p.billing_interval === interval)
  return plan ? parseFloat(plan.price_myr) : (interval === 'monthly' ? 29 : 290)
}

export function useFeatureFlag(key: string, userTier: 'free' | 'pro'): boolean {
  const { flags } = useConfig()
  const flag = flags[key]
  if (!flag?.enabled) return false
  if (flag.tier === 'all') return true
  return flag.tier === userTier || userTier === 'pro'
}
