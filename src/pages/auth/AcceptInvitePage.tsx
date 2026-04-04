import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { Building2, Home, Calendar, Mail, AlertTriangle, Check, FileText, Zap, Droplets, Wifi } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Invite, Property, Room, RentAgreement } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

type InviteWithDetails = Invite & { property: Property; room: Room; agreement_id?: string | null }

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, profile, signInWithMagicLink, signInWithGoogle } = useAuth()
  const { t } = useTranslation()

  const [invite, setInvite] = useState<InviteWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auth state
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // Agreement state
  const [agreement, setAgreement] = useState<RentAgreement | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    ic_number: '',
    emergency_contact: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (token) loadInvite()
  }, [token])

  async function loadInvite() {
    const { data, error: fetchError } = await supabase
      .from('invites')
      .select('*, property:properties(*), room:rooms(*)')
      .eq('token', token!)
      .single()

    if (fetchError || !data) {
      setError('Jemputan tidak dijumpai atau tidak sah.')
      setLoading(false)
      return
    }

    const inv = data as InviteWithDetails

    if (inv.status === 'accepted') {
      setError('Jemputan ini telah diterima.')
      setLoading(false)
      return
    }

    if (inv.status === 'revoked') {
      setError('Jemputan ini telah dibatalkan oleh tuan rumah.')
      setLoading(false)
      return
    }

    if (new Date(inv.expires_at) < new Date()) {
      setError('Jemputan ini telah tamat tempoh.')
      setLoading(false)
      return
    }

    setInvite(inv)
    if (inv.email) setEmail(inv.email)

    // Load agreement if linked
    if (inv.agreement_id) {
      const { data: agreementData } = await supabase
        .from('rent_agreements')
        .select('*')
        .eq('id', inv.agreement_id)
        .single()
      if (agreementData) setAgreement(agreementData)
    }

    setLoading(false)
  }

  // If user already has a profile (already a tenant/landlord), handle differently
  useEffect(() => {
    if (user && profile && invite) {
      // User already has a profile — if they're a tenant, just accept the invite
      if (profile.role === 'tenant') {
        handleAcceptWithExistingProfile()
      }
    }
  }, [user, profile, invite])

  async function handleAcceptWithExistingProfile() {
    if (!invite || !profile) return
    setSaving(true)

    // Create tenancy
    const { error: tenancyError } = await supabase.from('tenancies').insert({
      tenant_id: profile.id,
      room_id: invite.room_id,
      move_in: invite.move_in,
      deposit: invite.deposit,
      agreed_rent: invite.agreed_rent,
      status: 'active',
    })

    if (tenancyError) {
      toast.error('Gagal menerima jemputan. Bilik mungkin sudah berpenghuni.')
      setSaving(false)
      return
    }

    // Update room and invite
    await Promise.all([
      supabase.from('rooms').update({ status: 'occupied' }).eq('id', invite.room_id),
      supabase.from('invites').update({ status: 'accepted' }).eq('id', invite.id),
    ])

    setSaving(false)
    toast.success('Selamat datang! Anda kini terikat ke unit ini.')
    navigate('/tenant/dashboard')
    window.location.reload()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    const { error } = await signInWithMagicLink(email)
    setAuthLoading(false)
    if (error) {
      toast.error('Gagal hantar pautan log masuk.')
    } else {
      setEmailSent(true)
    }
  }

  async function handleGoogle() {
    // Store invite token in localStorage so we can resume after OAuth redirect
    localStorage.setItem('sewakita_invite_token', token!)
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error('Gagal log masuk dengan Google.')
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !invite) return

    setSaving(true)

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      auth_id: user.id,
      role: 'tenant' as const,
      name: profileForm.name,
      phone: profileForm.phone,
      email: user.email || '',
      ic_number: profileForm.ic_number || undefined,
      emergency_contact: profileForm.emergency_contact || undefined,
    })

    if (profileError) {
      toast.error('Gagal mencipta profil.')
      setSaving(false)
      return
    }

    // Fetch the newly created profile to get the ID
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!newProfile) {
      toast.error('Gagal mendapatkan profil.')
      setSaving(false)
      return
    }

    // Create tenancy
    const { error: tenancyError } = await supabase.from('tenancies').insert({
      tenant_id: newProfile.id,
      room_id: invite.room_id,
      move_in: invite.move_in,
      deposit: invite.deposit,
      agreed_rent: invite.agreed_rent,
      status: 'active',
    })

    if (tenancyError) {
      toast.error('Gagal mencipta penyewaan. Bilik mungkin sudah berpenghuni.')
      setSaving(false)
      return
    }

    // Update room, invite, and agreement
    await supabase.from('rooms').update({ status: 'occupied' }).eq('id', invite.room_id)
    await supabase.from('invites').update({ status: 'accepted' }).eq('id', invite.id)

    // Sign agreement if exists
    if (agreement) {
      await supabase.from('rent_agreements').update({
        tenant_id: newProfile.id,
        tenant_name: profileForm.name,
        tenant_ic: profileForm.ic_number || null,
        tenant_phone: profileForm.phone,
        tenant_signed_at: new Date().toISOString(),
        status: 'signed',
      }).eq('id', agreement.id)
    }

    setSaving(false)
    toast.success('Selamat datang ke SewaKita!')
    navigate('/tenant/dashboard')
    window.location.reload()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-amber-600" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Jemputan Tidak Sah</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} fullWidth>Ke Halaman Utama</Button>
        </div>
      </div>
    )
  }

  if (!invite) return null

  // Step 1: Not logged in — show invite details + auth
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm animate-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">SewaKita</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Anda dijemput untuk menyewa</p>
          </div>

          {/* Invite details card */}
          <Card variant="elevated" padding="p-5" className="mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Building2 className="text-primary-600" size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{invite.property.name}</p>
                <p className="text-sm text-gray-500">{invite.property.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Bilik</p>
                <p className="font-semibold text-gray-800">{invite.room.label}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Sewa</p>
                <p className="font-semibold text-gray-800">RM{invite.agreed_rent}/bln</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Deposit</p>
                <p className="font-semibold text-gray-800">RM{invite.deposit}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Tarikh Masuk</p>
                <p className="font-semibold text-gray-800">{invite.move_in}</p>
              </div>
            </div>
          </Card>

          {/* Auth form */}
          <div className="bg-white rounded-3xl shadow-lg p-7">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Log masuk untuk menerima</h2>

            {emailSent ? (
              <div className="text-center py-4 animate-in">
                <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-primary-600" size={28} />
                </div>
                <h3 className="text-base font-semibold text-gray-800">Semak email anda</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Pautan log masuk telah dihantar ke <strong>{email}</strong>
                </p>
                <button onClick={() => setEmailSent(false)} className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Guna email lain
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <Input label="Alamat email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="contoh@email.com" />
                  <Button type="submit" loading={authLoading} fullWidth size="lg">
                    Log masuk dengan email
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">atau</span></div>
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
        </div>
      </div>
    )
  }

  // Step 2: Logged in but no profile — show profile creation form
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm animate-in">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">SewaKita</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Lengkapkan profil anda untuk menerima jemputan</p>
          </div>

          {/* Invite summary */}
          <Card variant="outlined" padding="p-4" className="mb-5 !border-primary-200 bg-primary-50">
            <div className="flex items-center gap-3">
              <Home size={18} className="text-primary-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-primary-700">{invite.property.name}</span>
                <span className="text-primary-600"> — {invite.room.label} — RM{invite.agreed_rent}/bln</span>
              </div>
            </div>
          </Card>

          <div className="bg-white rounded-3xl shadow-lg p-7">
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Maklumat anda</h2>

              <Input label="Nama penuh *" type="text" required value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Nama anda" />

              <Input label="No. telefon *" type="tel" required value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="012-3456789" />

              <Input label="No. IC (pilihan)" type="text" value={profileForm.ic_number}
                onChange={(e) => setProfileForm({ ...profileForm, ic_number: e.target.value })} placeholder="123456-78-9012" />

              <Input label="Nombor kecemasan (pilihan)" type="text" value={profileForm.emergency_contact}
                onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })} placeholder="012-3456789" />

              {/* Agreement — full display if linked */}
              {agreement && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <p className="text-base font-bold text-gray-800">{t('invite.agreement_title')}</p>

                  {/* Terms grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase">{t('agreement.rent')}</p>
                      <p className="font-bold text-gray-800">RM{agreement.rent_amount}/mo</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase">{t('agreement.deposit')}</p>
                      <p className="font-bold text-gray-800">RM{agreement.deposit_amount}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase">{t('agreement.payment_day')}</p>
                      <p className="font-bold text-gray-800">Day {agreement.payment_due_day}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase">{t('agreement.notice_period')}</p>
                      <p className="font-bold text-gray-800">{agreement.notice_period_days} days</p>
                    </div>
                  </div>

                  {/* Utilities */}
                  {agreement.utilities_included && agreement.utilities_included.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">{t('agreement.utilities_section')}</p>
                      <div className="space-y-1.5">
                        {agreement.utilities_included.map(u => (
                          <div key={u.type} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-700">{u.type === 'electric' ? 'Electricity' : u.type === 'water' ? 'Water' : 'Internet'}</span>
                            <span className={`text-xs font-medium ${u.included ? 'text-green-600' : 'text-gray-500'}`}>
                              {u.included ? t('agreement.included') : t('agreement.tenant_pays')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rules */}
                  {agreement.rules && agreement.rules.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">{t('agreement.house_rules')}</p>
                      <ol className="space-y-1 list-decimal list-inside text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {agreement.rules.map((r, i) => <li key={i}>{r.rule}</li>)}
                      </ol>
                    </div>
                  )}

                  {/* Additional terms */}
                  {agreement.additional_terms && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">{t('agreement.additional_terms')}</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{agreement.additional_terms}</p>
                    </div>
                  )}

                  {/* Agree checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer bg-primary-50 rounded-xl p-3">
                    <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-700 font-medium">{t('invite.agree_terms')}</span>
                  </label>
                </div>
              )}

              <Button type="submit" size="lg" loading={saving} fullWidth
                disabled={agreement ? !agreedToTerms : false}>
                {agreement ? t('invite.agree_accept') : t('invite.accept_start')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Has profile, waiting for acceptance (auto-handled by useEffect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
      <div className="text-center animate-in">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <Check className="text-primary-600" size={28} />
        </div>
        <p className="text-sm text-gray-500">Menerima jemputan...</p>
        <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mt-4" />
      </div>
    </div>
  )
}
