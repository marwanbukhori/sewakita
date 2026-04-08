import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Check, Crown, X, Building2, BarChart3, CreditCard, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { SkeletonList } from '@/components/ui/Skeleton'
import {
  getActiveSubscription,
  formatPeriodRemaining,
  type SubscriptionWithPlan,
} from '@/lib/subscription'
import { SUBSCRIPTION_PAYMENTS_ENABLED, getPlanTier } from '@/lib/feature-gates'

type Interval = 'monthly' | 'annual'

const FREE_FEATURES = [
  { icon: Building2, label: '1 property' },
  { icon: Check, label: 'Bill generation & WhatsApp' },
  { icon: Check, label: 'Manual payment recording' },
]

const PRO_FEATURES = [
  { icon: Building2, label: 'Unlimited properties' },
  { icon: CreditCard, label: 'Online payment (FPX)' },
  { icon: BarChart3, label: 'Reports & analytics' },
  { icon: Camera, label: 'OCR bill scanning' },
  { icon: Check, label: 'PDF export' },
  { icon: Check, label: 'Priority support' },
]

export default function PlansPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null)
  const [interval, setInterval] = useState<Interval>('annual')
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [showPromo, setShowPromo] = useState(false)

  useEffect(() => {
    if (!profile) return
    loadSubscription()
  }, [profile])

  async function loadSubscription() {
    const sub = await getActiveSubscription(profile!.id)
    setSubscription(sub)
    setLoading(false)
  }

  const tier = getPlanTier(subscription?.plan_code)
  const isPro = tier === 'pro'
  const price = interval === 'monthly' ? 29 : 290

  async function handleUpgrade() {
    if (!SUBSCRIPTION_PAYMENTS_ENABLED) {
      toast('Coming soon — online payments are not yet available.')
      return
    }
    setCheckingOut(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      const planCode = interval === 'monthly' ? 'pro_monthly' : 'pro_annual'
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-bill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ plan_code: planCode }),
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
      setCheckingOut(false)
    }
  }

  async function handleRedeemPromo() {
    if (!promoCode.trim()) return
    setRedeeming(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-promo-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ code: promoCode }),
        }
      )
      const data = await res.json()
      if (data.success) {
        toast.success(data.permanent ? 'Pro activated permanently!' : 'Pro activated!')
        setPromoCode('')
        setShowPromo(false)
        loadSubscription()
      } else {
        const messages: Record<string, string> = {
          code_invalid: 'Invalid code. Please check and try again.',
          code_expired: 'This code has expired.',
          code_exhausted: 'This code has reached its usage limit.',
          already_pro: 'You\'re already on Pro!',
        }
        toast.error(messages[data.error] || 'Failed to redeem code')
      }
    } catch {
      toast.error('Failed to redeem code')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-5 animate-in pb-8">
      <h1 className="text-xl font-bold text-gray-800">Plans</h1>

      {/* Current status */}
      {subscription && (
        <Card variant="elevated" padding="p-4">
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-primary-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{subscription.plan.display_name}</p>
              <p className="text-xs text-gray-500">{formatPeriodRemaining(subscription.period_end)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Interval toggle */}
      {!isPro && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setInterval('monthly')}
            className={`px-4 h-9 rounded-full text-sm font-medium transition ${interval === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Monthly
          </button>
          <button onClick={() => setInterval('annual')}
            className={`px-4 h-9 rounded-full text-sm font-medium transition flex items-center gap-2 ${interval === 'annual' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Annual
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${interval === 'annual' ? 'bg-white text-primary-700' : 'bg-primary-100 text-primary-700'}`}>
              Save RM38
            </span>
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Free card */}
        <Card variant={!isPro ? 'elevated' : 'default'} padding="p-5" className={!isPro ? 'border-2 border-primary-200' : ''}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-gray-800">Free</p>
              <p className="text-sm text-gray-500">RM 0 — forever</p>
            </div>
            {!isPro && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-semibold">Current</span>
            )}
          </div>
          <div className="space-y-2">
            {FREE_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <f.icon size={14} className="text-gray-400 shrink-0" />
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Pro card */}
        <Card variant={isPro ? 'elevated' : 'default'} padding="p-5" className={isPro ? 'border-2 border-primary-200' : 'border border-gray-200'}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-gray-800">Pro</p>
              <p className="text-sm text-gray-500">
                RM {price}/{interval === 'monthly' ? 'month' : 'year'}
              </p>
            </div>
            {isPro && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                <Check size={12} /> Active
              </span>
            )}
          </div>
          <div className="space-y-2 mb-4">
            {PRO_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <f.icon size={14} className="text-primary-600 shrink-0" />
                <span>{f.label}</span>
              </div>
            ))}
          </div>
          {!isPro && (
            <Button fullWidth loading={checkingOut} onClick={handleUpgrade}>
              {SUBSCRIPTION_PAYMENTS_ENABLED
                ? `Upgrade to Pro — RM${price}`
                : 'Coming Soon'}
            </Button>
          )}
        </Card>
      </div>

      {/* Promo code section */}
      {!isPro && (
        <div className="text-center">
          {!showPromo ? (
            <button onClick={() => setShowPromo(true)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Have an invite code?
            </button>
          ) : (
            <Card variant="elevated" padding="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">Enter invite code</p>
                <button onClick={() => setShowPromo(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RERUMAH30"
                  className="flex-1 !uppercase"
                />
                <Button loading={redeeming} onClick={handleRedeemPromo} disabled={!promoCode.trim()}>
                  Redeem
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
