import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, X, Zap, Droplets, Wifi } from 'lucide-react'
import type { Property, Room, UtilityType } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'

const SUGGESTED_RULES = [
  'No smoking inside the unit',
  'No pets allowed',
  'Quiet hours: 10pm - 7am',
  'No subletting without written consent',
  'Keep common areas clean',
  'No illegal activities',
  'No modification to the unit without consent',
  'Visitors must leave by 11pm',
]

const UTILITY_OPTIONS: { type: UtilityType; label: string; icon: typeof Zap }[] = [
  { type: 'electric', label: 'Electricity (TNB)', icon: Zap },
  { type: 'water', label: 'Water (SYABAS)', icon: Droplets },
  { type: 'internet', label: 'Internet', icon: Wifi },
]

export default function AgreementFormPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteId = searchParams.get('invite_id')
  const prePropertyId = searchParams.get('property_id')
  const preRoomId = searchParams.get('room_id')

  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<(Property & { rooms: Room[] })[]>([])

  const [form, setForm] = useState({
    property_id: prePropertyId || '',
    room_id: preRoomId || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    rent_amount: '',
    deposit_amount: '',
    payment_due_day: 1,
    notice_period_days: 30,
    utilities: UTILITY_OPTIONS.map(u => ({ type: u.type, included: false, note: '' })),
    rules: [] as string[],
    customRule: '',
    additional_terms: '',
    landlord_name: profile?.name || '',
    landlord_ic: '',
    landlord_phone: profile?.phone || '',
    landlord_address: '',
  })

  useEffect(() => {
    if (!profile) return
    loadProperties()
  }, [profile])

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('*, rooms(*)')
      .eq('landlord_id', profile!.id)
      .eq('is_active', true)
    setProperties(data || [])

    // Auto-fill rent from room
    if (preRoomId && data) {
      for (const prop of data) {
        const room = prop.rooms?.find((r: Room) => r.id === preRoomId)
        if (room) {
          setForm(f => ({ ...f, rent_amount: String(room.rent_amount) }))
          break
        }
      }
    }
  }

  function toggleRule(rule: string) {
    setForm(f => ({
      ...f,
      rules: f.rules.includes(rule) ? f.rules.filter(r => r !== rule) : [...f.rules, rule],
    }))
  }

  function addCustomRule() {
    if (!form.customRule.trim()) return
    setForm(f => ({ ...f, rules: [...f.rules, f.customRule.trim()], customRule: '' }))
  }

  function removeRule(rule: string) {
    setForm(f => ({ ...f, rules: f.rules.filter(r => r !== rule) }))
  }

  function toggleUtility(type: UtilityType) {
    setForm(f => ({
      ...f,
      utilities: f.utilities.map(u => u.type === type ? { ...u, included: !u.included } : u),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)

    const { data, error } = await supabase.from('rent_agreements').insert({
      property_id: form.property_id,
      room_id: form.room_id,
      landlord_id: profile.id,
      start_date: form.start_date,
      end_date: form.end_date || null,
      rent_amount: Number(form.rent_amount),
      deposit_amount: Number(form.deposit_amount),
      payment_due_day: form.payment_due_day,
      notice_period_days: form.notice_period_days,
      utilities_included: form.utilities,
      rules: form.rules.map(rule => ({ rule })),
      additional_terms: form.additional_terms || null,
      landlord_name: form.landlord_name,
      landlord_ic: form.landlord_ic || null,
      landlord_phone: form.landlord_phone,
      landlord_address: form.landlord_address || null,
      landlord_signed_at: new Date().toISOString(),
      status: 'sent',
    }).select().single()

    if (error || !data) {
      toast.error('Gagal mencipta perjanjian.')
      setLoading(false)
      return
    }

    // Link to invite if provided
    if (inviteId) {
      await supabase.from('invites').update({ agreement_id: data.id }).eq('id', inviteId)
    }

    setLoading(false)
    toast.success('Perjanjian sewa berjaya dicipta!')
    navigate(`/agreements/${data.id}`)
  }

  const selectedProperty = properties.find(p => p.id === form.property_id)
  const vacantRooms = selectedProperty?.rooms?.filter((r: Room) => r.is_active) || []

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <h1 className="text-xl font-bold text-gray-800">Perjanjian Sewa</h1>
      <p className="text-sm text-gray-500">Isi butiran perjanjian. Penyewa mesti bersetuju sebelum akses diberikan.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Tenancy Details */}
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Butiran Penyewaan</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Hartanah *" required value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value, room_id: '' })}>
                <option value="">Pilih</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Select label="Bilik *" required value={form.room_id}
                onChange={(e) => {
                  const room = vacantRooms.find(r => r.id === e.target.value)
                  setForm({ ...form, room_id: e.target.value, rent_amount: room ? String(room.rent_amount) : form.rent_amount })
                }}>
                <option value="">Pilih</option>
                {vacantRooms.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Tarikh mula *" type="date" required value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              <Input label="Tarikh tamat" type="date" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                helperText="Kosongkan untuk bulanan" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Sewa (RM) *" type="number" required value={form.rent_amount}
                onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} />
              <Input label="Deposit (RM) *" type="number" required value={form.deposit_amount}
                onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select label="Hari bayaran" value={form.payment_due_day}
                onChange={(e) => setForm({ ...form, payment_due_day: Number(e.target.value) })}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d =>
                  <option key={d} value={d}>Hari {d}</option>
                )}
              </Select>
              <Select label="Tempoh notis (hari)" value={form.notice_period_days}
                onChange={(e) => setForm({ ...form, notice_period_days: Number(e.target.value) })}>
                <option value={14}>14 hari</option>
                <option value={30}>30 hari</option>
                <option value={60}>60 hari</option>
                <option value={90}>90 hari</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Section 2: Utilities */}
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Utiliti Termasuk dalam Sewa</p>
          <div className="space-y-3">
            {UTILITY_OPTIONS.map(opt => {
              const util = form.utilities.find(u => u.type === opt.type)
              return (
                <button key={opt.type} type="button" onClick={() => toggleUtility(opt.type)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    util?.included ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
                  }`}>
                  <opt.icon size={18} className={util?.included ? 'text-primary-600' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${util?.included ? 'text-primary-700' : 'text-gray-600'}`}>
                    {opt.label}
                  </span>
                  <span className={`ml-auto text-xs font-semibold ${util?.included ? 'text-primary-600' : 'text-gray-400'}`}>
                    {util?.included ? 'Termasuk' : 'Penyewa bayar'}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Section 3: House Rules */}
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Peraturan Rumah</p>

          {/* Suggested rules */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_RULES.map(rule => (
              <button key={rule} type="button" onClick={() => toggleRule(rule)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.rules.includes(rule)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {rule}
              </button>
            ))}
          </div>

          {/* Selected rules */}
          {form.rules.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {form.rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                  <span className="text-xs text-gray-500 w-5 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-gray-700 flex-1">{rule}</span>
                  <button type="button" onClick={() => removeRule(rule)} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Custom rule */}
          <div className="flex gap-2">
            <Input placeholder="Tambah peraturan lain..." value={form.customRule}
              onChange={(e) => setForm({ ...form, customRule: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomRule() } }} />
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addCustomRule}>
              Tambah
            </Button>
          </div>
        </Card>

        {/* Section 4: Additional Terms */}
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Terma Tambahan</p>
          <textarea
            value={form.additional_terms}
            onChange={(e) => setForm({ ...form, additional_terms: e.target.value })}
            placeholder="Masukkan terma tambahan (pilihan)..."
            className="w-full h-24 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
          />
        </Card>

        {/* Section 5: Landlord Info */}
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Maklumat Tuan Rumah</p>
          <div className="space-y-4">
            <Input label="Nama penuh *" required value={form.landlord_name}
              onChange={(e) => setForm({ ...form, landlord_name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="No. IC" value={form.landlord_ic}
                onChange={(e) => setForm({ ...form, landlord_ic: e.target.value })} />
              <Input label="No. telefon *" required value={form.landlord_phone}
                onChange={(e) => setForm({ ...form, landlord_phone: e.target.value })} />
            </div>
            <Input label="Alamat" value={form.landlord_address}
              onChange={(e) => setForm({ ...form, landlord_address: e.target.value })} />
          </div>
        </Card>

        <Button type="submit" loading={loading} fullWidth size="lg">
          Cipta & Tandatangan Perjanjian
        </Button>
      </form>
    </div>
  )
}
