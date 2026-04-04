import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database'
import toast from 'react-hot-toast'
import { Building2, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [role, setRole] = useState<UserRole>('landlord')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const { error } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      auth_id: user.id,
      role,
      name,
      phone,
      email: user.email || '',
    })
    setLoading(false)

    if (error) {
      toast.error(t('onboarding.failed_save'))
      return
    }

    toast.success(t('onboarding.welcome_toast'))
    navigate(role === 'landlord' ? '/dashboard' : '/tenant/dashboard')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm animate-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">SewaKita</h1>
          <p className="text-gray-500 mt-1.5 text-sm">{t('onboarding.welcome')}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${step === 'role' ? 'bg-primary-600 w-6' : 'bg-gray-300'} transition-all duration-200`} />
          <div className={`w-2 h-2 rounded-full ${step === 'details' ? 'bg-primary-600 w-6' : 'bg-gray-300'} transition-all duration-200`} />
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-7">
          {step === 'role' ? (
            <div className="space-y-4 animate-in">
              <h2 className="text-lg font-semibold text-gray-800">{t('onboarding.you_are')}</h2>
              {[
                { value: 'landlord' as UserRole, icon: Building2, title: t('onboarding.landlord'), desc: t('onboarding.landlord_desc') },
                { value: 'tenant' as UserRole, icon: User, title: t('onboarding.tenant'), desc: t('onboarding.tenant_desc') },
              ].map((opt) => (
                <Card
                  key={opt.value}
                  variant="outlined"
                  pressable
                  padding="p-4"
                  className="!rounded-xl"
                >
                  <button
                    onClick={() => { setRole(opt.value); setStep('details') }}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                      <opt.icon className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{opt.title}</div>
                      <div className="text-sm text-gray-500">{opt.desc}</div>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in">
              <h2 className="text-lg font-semibold text-gray-800">{t('onboarding.your_info')}</h2>
              <Input
                label={t('onboarding.full_name')}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboarding.full_name')}
              />
              <Input
                label={t('onboarding.phone')}
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('onboarding.phone_placeholder')}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setStep('role')}
                  className="flex-1"
                >
                  {t('onboarding.back')}
                </Button>
                <Button type="submit" size="lg" loading={loading} className="flex-1">
                  {t('onboarding.get_started')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
