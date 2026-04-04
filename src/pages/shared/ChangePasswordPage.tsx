import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(t('common.save') + '!')
    navigate('/account')
  }

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Shield size={20} className="text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">{t('account.change_password')}</h1>
      </div>

      <Card variant="elevated" padding="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="New password" type="password" required value={password} minLength={6}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <Input label="Confirm password" type="password" required value={confirm} minLength={6}
            onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          <Button type="submit" loading={loading} fullWidth size="lg">
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
