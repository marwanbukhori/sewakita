import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const { signInWithMagicLink, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signInWithMagicLink(email)
    setLoading(false)
    if (error) {
      toast.error('Gagal hantar pautan. Sila cuba lagi.')
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error('Gagal log masuk dengan Google.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">SewaKita</h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Urus sewa rumah dan bilik dengan mudah
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-7">
          {sent ? (
            <div className="text-center py-4 animate-in">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="text-primary-600" size={28} />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Semak email anda</h2>
              <p className="text-sm text-gray-500 mt-2">
                Pautan log masuk telah dihantar ke <strong>{email}</strong>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Guna email lain
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  label="Alamat email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                />
                <Button type="submit" loading={loading} fullWidth size="lg">
                  Log masuk dengan email
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">atau</span>
                </div>
              </div>

              <Button variant="secondary" fullWidth size="lg" onClick={handleGoogle}>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Log masuk dengan Google
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Dengan log masuk, anda bersetuju dengan{' '}
          <a href="#" className="text-primary-600">Dasar Privasi</a> kami.
        </p>
      </div>
    </div>
  )
}
