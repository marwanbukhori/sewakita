import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Check, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SectionHeader from '@/components/ui/SectionHeader'
import { SkeletonList } from '@/components/ui/Skeleton'
import {
  getActiveSubscription,
  listPlans,
  formatPeriodRemaining,
  type Plan,
  type SubscriptionWithPlan,
} from '@/lib/subscription'
import { ONLINE_PAYMENTS_ENABLED, getPlanTier } from '@/lib/feature-gates'

type Interval = 'monthly' | 'annual'

interface TierGroup {
  tierKey: string                // 'starter' | 'pro' | 'business'
  displayName: string
  monthly?: Plan
  annual?: Plan
}

export default function PlansPage() {
  const { profile } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [interval, setInterval] = useState<Interval>('annual')
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    load()
  }, [profile])

  async function load() {
    const [sub, allPlans] = await Promise.all([
      getActiveSubscription(profile!.id),
      listPlans(),
    ])
    setSubscription(sub)
    setPlans(allPlans)
    setLoading(false)
  }

  async function handleChoosePlan(plan: Plan) {
    if (plan.code === 'free' || plan.billing_interval === 'none') {
      toast('Free plan: just keep using the app — no checkout needed.')
      return
    }
    setCheckingOut(plan.code)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-bill`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan_code: plan.code }),
        }
      )
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        toast.error(data.error || 'Could not start checkout')
      }
    } catch {
      toast.error('Checkout failed')
    } finally {
      setCheckingOut(null)
    }
  }

  if (loading) return <SkeletonList count={4} />

  // Group plans by tier
  const tierMap = new Map<string, TierGroup>()
  for (const p of plans) {
    const tierKey = p.code === 'free' ? 'free' : p.code.replace(/_monthly$|_annual$/, '')
    if (!tierMap.has(tierKey)) {
      const displayName = p.display_name.replace(/ \(Monthly\)| \(Annual\)/, '')
      tierMap.set(tierKey, { tierKey, displayName })
    }
    const group = tierMap.get(tierKey)!
    if (p.billing_interval === 'monthly') group.monthly = p
    else if (p.billing_interval === 'annual') group.annual = p
    else group.monthly = p  // free plan goes under "monthly" slot for display
  }
  const tiers = Array.from(tierMap.values())

  return (
    <div className="space-y-5 animate-in pb-8">
      <h1 className="text-xl font-bold text-gray-800">Plans & Billing</h1>

      {/* Current status */}
      {subscription && (
        <Card variant="elevated" padding="p-4">
          <div className="flex items-center gap-3">
            <Crown size={22} className="text-primary-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {subscription.plan.display_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatPeriodRemaining(subscription.period_end)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setInterval('monthly')}
          className={`px-4 h-9 rounded-full text-sm font-medium transition ${
            interval === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval('annual')}
          className={`px-4 h-9 rounded-full text-sm font-medium transition inline-flex items-center gap-2 ${
            interval === 'annual' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Annual
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            interval === 'annual' ? 'bg-white text-primary-700' : 'bg-primary-100 text-primary-700'
          }`}>2 months free</span>
        </button>
      </div>

      {/* Plan cards */}
      <SectionHeader title="Choose a plan" />
      <div className="space-y-3">
        {tiers.map((tier) => {
          const plan = interval === 'monthly' ? tier.monthly : tier.annual
          if (!plan) return null
          const isCurrent = subscription?.plan_code === plan.code
          return (
            <Card key={plan.code} variant="outlined" padding="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{tier.displayName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {plan.billing_interval === 'none'
                      ? 'Free forever'
                      : plan.billing_interval === 'annual'
                      ? `RM ${plan.price_myr}/year`
                      : `RM ${plan.price_myr}/month`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  loading={checkingOut === plan.code}
                  onClick={() => handleChoosePlan(plan)}
                  disabled={isCurrent}
                >
                  {isCurrent ? <><Check size={14} /> Current</> : 'Choose'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
