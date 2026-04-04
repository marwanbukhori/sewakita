import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LanguageToggle from '@/components/ui/LanguageToggle'
import { BatikBackground } from '@/assets/batik/patterns'

export default function LoginPage() {
  const { signInWithMagicLink, signInWithGoogle } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signInWithMagicLink(email)
    setLoading(false)
    if (error) {
      toast.error(t('auth.failed_send'))
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error(t('auth.failed_google'))
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Batik background decoration */}
      <BatikBackground className="absolute top-0 left-0 w-full h-full text-primary-600 pointer-events-none" />

      <div className="w-full max-w-sm animate-in relative z-10">
        {/* Language toggle — login page keeps it since no hamburger here */}
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t('app.name')}</h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            {t('app.tagline')}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-7">
          {sent ? (
            <div className="text-center py-4 animate-in">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="text-primary-600" size={28} />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">{t('auth.check_email')}</h2>
              <p className="text-sm text-gray-500 mt-2">
                {t('auth.magic_link_sent')} <strong>{email}</strong>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('auth.use_another_email')}
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  label={t('auth.email_label')}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                />
                <Button type="submit" loading={loading} fullWidth size="lg">
                  {t('auth.login_email')}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">{t('auth.or')}</span>
                </div>
              </div>

              <Button variant="secondary" fullWidth size="lg" onClick={handleGoogle}>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('auth.login_google')}
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {t('auth.privacy')}{' '}
          <a href="#" className="text-primary-600">{t('auth.privacy_policy')}</a>.
        </p>
        <Link to="/" className="block text-center text-xs text-primary-600 hover:text-primary-700 font-medium mt-3">
          ← {t('common.back')}
        </Link>
      </div>
    </div>
  )
}
