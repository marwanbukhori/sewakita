import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BatikBackground } from '@/assets/batik/patterns'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error(t('auth.confirm_password'))
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(t('auth.password_updated'))
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <BatikBackground className="absolute top-0 left-0 w-full h-full text-primary-600 pointer-events-none" />

      <div className="w-full max-w-sm animate-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t('auth.reset_password')}</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.new_password')}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
            <Input
              label={t('auth.confirm_password')}
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
            <Button type="submit" loading={loading} fullWidth size="lg">
              {t('auth.reset_password')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
