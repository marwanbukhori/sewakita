import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Loader } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type Phase = 'polling' | 'active' | 'failed' | 'timeout'

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subId = searchParams.get('sub')
  const [phase, setPhase] = useState<Phase>('polling')
  const [planName, setPlanName] = useState<string>('')

  useEffect(() => {
    if (!subId) {
      setPhase('failed')
      return
    }
    let attempts = 0
    const maxAttempts = 10
    const interval = setInterval(async () => {
      attempts++
      const { data } = await supabase
        .from('subscriptions')
        .select('status, plan:plans(display_name)')
        .eq('id', subId)
        .single()

      if (data?.status === 'active') {
        setPlanName((data.plan as unknown as { display_name: string })?.display_name || 'your plan')
        setPhase('active')
        clearInterval(interval)
      } else if (attempts >= maxAttempts) {
        setPhase('timeout')
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [subId])

  return (
    <div className="max-w-sm mx-auto text-center py-12 animate-in">
      {phase === 'polling' && (
        <>
          <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
            <Loader className="text-primary-600 animate-spin" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming your payment…</h1>
          <p className="text-sm text-gray-500">This usually takes a few seconds.</p>
        </>
      )}

      {phase === 'active' && (
        <>
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You're on {planName}</h1>
          <p className="text-sm text-gray-500 mb-8">Your subscription is active. Thanks for supporting ReRumah.</p>
          <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </>
      )}

      {phase === 'timeout' && (
        <>
          <Card variant="outlined" padding="p-5" className="mb-4 text-left">
            <p className="text-sm text-gray-700">
              Payment received but activation is taking longer than expected. If it doesn't update in a minute, refresh this page or contact support.
            </p>
          </Card>
          <Button fullWidth variant="secondary" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </>
      )}

      {phase === 'failed' && (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Missing subscription id</h1>
          <Button fullWidth variant="secondary" onClick={() => navigate('/plans')}>
            Back to Plans
          </Button>
        </>
      )}
    </div>
  )
}
