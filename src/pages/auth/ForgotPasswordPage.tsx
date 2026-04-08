import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BatikBackground } from '@/assets/batik/patterns'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <BatikBackground className="absolute top-0 left-0 w-full h-full text-primary-600 pointer-events-none" />

      <div className="w-full max-w-sm animate-in relative z-10">
        <div className="text-center mb-8">
          <img src="/logos/logo-full.svg" alt="ReRumah" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">{t('auth.reset_password')}</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-7">
          {sent ? (
            <div className="text-center py-4 animate-in">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="text-primary-600" size={28} />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">{t('auth.reset_link_sent')}</h2>
              <p className="text-sm text-gray-500 mt-2">{email}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.email_label')}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
              />
              <Button type="submit" loading={loading} fullWidth size="lg">
                {t('auth.reset_password')}
              </Button>
            </form>
          )}
        </div>

        <Link to="/login" className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium mt-6">
          ← {t('auth.back_to_login')}
        </Link>
      </div>
    </div>
  )
}
