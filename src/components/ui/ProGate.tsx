import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getCurrentPlanCode } from '@/lib/subscription'
import { getPlanTier } from '@/lib/feature-gates'
import { useConfig } from '@/lib/config'
import Button from '@/components/ui/Button'

interface ProGateProps {
  children: ReactNode
  feature?: string
}

export default function ProGate({ children, feature }: ProGateProps) {
  const { profile } = useAuth()
  const { plans } = useConfig()
  const [tier, setTier] = useState<'free' | 'pro' | null>(null)
  const monthlyPrice = plans.find(p => p.billing_interval === 'monthly')?.price_myr || '29'
  const annualPrice = plans.find(p => p.billing_interval === 'annual')?.price_myr || '290'

  useEffect(() => {
    if (!profile) return
    getCurrentPlanCode(profile.id).then(code => setTier(getPlanTier(code)))
  }, [profile])

  // Still loading — show children without gate (avoids flash)
  if (tier === null) return <>{children}</>

  // Pro user — no gate
  if (tier === 'pro') return <>{children}</>

  // Free user — show blurred content with upgrade overlay
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-xs text-center mx-4">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {feature === 'reports' ? 'Reports & Analytics' : 'Pro Feature'}
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Upgrade to Pro to unlock {feature === 'reports' ? 'reports, charts, and PDF export' : 'this feature'}.
          </p>
          <Link to="/plans">
            <Button fullWidth>Upgrade to Pro — RM{parseFloat(monthlyPrice).toFixed(0)}/month</Button>
          </Link>
          <p className="text-[11px] text-gray-400 mt-3">Or RM{parseFloat(annualPrice).toFixed(0)}/year (save 2 months)</p>
        </div>
      </div>
    </div>
  )
}
