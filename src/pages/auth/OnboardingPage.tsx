import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database'
import toast from 'react-hot-toast'
import { Building2, User } from 'lucide-react'

export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [role, setRole] = useState<UserRole>('landlord')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

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
      toast.error('Gagal menyimpan. Sila cuba lagi.')
      return
    }

    toast.success('Selamat datang ke SewaKita!')
    navigate(role === 'landlord' ? '/dashboard' : '/tenant/dashboard')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">SewaKita</h1>
          <p className="text-gray-500 mt-2 text-sm">Selamat datang! Mari sediakan akaun anda.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {step === 'role' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Anda adalah...</h2>
              <button
                onClick={() => { setRole('landlord'); setStep('details') }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
              >
                <Building2 className="text-primary-600 shrink-0" size={24} />
                <div>
                  <div className="font-medium text-gray-900">Tuan Rumah</div>
                  <div className="text-sm text-gray-500">Saya menyewakan bilik atau unit</div>
                </div>
              </button>
              <button
                onClick={() => { setRole('tenant'); setStep('details') }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
              >
                <User className="text-primary-600 shrink-0" size={24} />
                <div>
                  <div className="font-medium text-gray-900">Penyewa</div>
                  <div className="text-sm text-gray-500">Saya menyewa bilik atau unit</div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Maklumat anda</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama penuh</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama anda"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. telefon</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012-3456789"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Menyimpan...' : 'Mula guna'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
