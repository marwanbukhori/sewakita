import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function ProfileEditPage() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    ic_number: profile?.ic_number || '',
    emergency_contact: profile?.emergency_contact || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)

    const { error } = await supabase.from('profiles').update({
      name: form.name,
      phone: form.phone,
      ic_number: form.ic_number || null,
      emergency_contact: form.emergency_contact || null,
    }).eq('id', profile.id)

    setLoading(false)
    if (error) {
      toast.error(t('onboarding.failed_save'))
      return
    }
    toast.success(t('common.save') + '!')
    navigate('/account')
    window.location.reload()
  }

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <User size={20} className="text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">{t('account.personal_info')}</h1>
      </div>

      <Card variant="elevated" padding="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('onboarding.full_name') + ' *'} required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label={t('onboarding.phone') + ' *'} type="tel" required value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t('agreement.ic_number')} value={form.ic_number}
            onChange={(e) => setForm({ ...form, ic_number: e.target.value })} />
          <Input label="Emergency contact" value={form.emergency_contact}
            onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
          <Button type="submit" loading={loading} fullWidth size="lg">
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
