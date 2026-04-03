import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { ArrowLeft, Copy, MessageCircle, Check, Link as LinkIcon } from 'lucide-react'
import type { Property, Room } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'

export default function TenantFormPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedRoomId = searchParams.get('room_id')
  const preselectedPropertyId = searchParams.get('property_id')

  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<(Property & { rooms: Room[] })[]>([])
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    property_id: preselectedPropertyId || '',
    room_id: preselectedRoomId || '',
    email: '',
    agreed_rent: '',
    deposit: '',
    move_in: new Date().toISOString().split('T')[0],
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

    if (preselectedRoomId && data) {
      for (const prop of data) {
        const room = prop.rooms?.find((r: Room) => r.id === preselectedRoomId)
        if (room) {
          setForm((f) => ({ ...f, agreed_rent: String(room.rent_amount) }))
          break
        }
      }
    }
  }

  const vacantRooms = properties
    .find((p) => p.id === form.property_id)
    ?.rooms?.filter((r: Room) => r.status === 'vacant' && r.is_active) || []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setLoading(true)

    const { data, error } = await supabase.from('invites').insert({
      property_id: form.property_id,
      room_id: form.room_id,
      landlord_id: profile.id,
      email: form.email || null,
      agreed_rent: Number(form.agreed_rent),
      deposit: Number(form.deposit),
      move_in: form.move_in,
      status: 'pending',
    }).select().single()

    setLoading(false)

    if (error || !data) {
      toast.error('Gagal mencipta jemputan.')
      return
    }

    const link = `${window.location.origin}/invite/${data.token}`
    setInviteLink(link)
    toast.success('Jemputan berjaya dicipta!')
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Pautan disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsAppShare() {
    if (!inviteLink) return
    const room = vacantRooms.find((r) => r.id === form.room_id)
    const property = properties.find((p) => p.id === form.property_id)
    const message = `Assalamualaikum,\n\nAnda dijemput untuk menyewa di *${property?.name}* (${room?.label}).\n\nSewa: RM${form.agreed_rent}/bulan\nDeposit: RM${form.deposit}\n\nSila klik pautan di bawah untuk mendaftar:\n${inviteLink}\n\n— SewaKita`
    window.open(`https://wa.me/${form.email ? '' : ''}?text=${encodeURIComponent(message)}`, '_blank')
  }

  // After invite created — show success with share options
  if (inviteLink) {
    const room = vacantRooms.find((r) => r.id === form.room_id)
    const property = properties.find((p) => p.id === form.property_id)

    return (
      <div className="max-w-lg mx-auto space-y-4 animate-in">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Jemputan Dicipta</h1>
          <p className="text-sm text-gray-500 mt-2">
            Kongsi pautan ini dengan penyewa untuk {property?.name} — {room?.label}
          </p>
        </div>

        <Card variant="elevated" padding="p-5">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 mb-4">
            <LinkIcon size={16} className="text-gray-400 shrink-0" />
            <p className="text-xs text-gray-600 truncate flex-1">{inviteLink}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button icon={copied ? Check : Copy} variant="secondary" onClick={handleCopy} fullWidth>
              {copied ? 'Disalin!' : 'Salin Pautan'}
            </Button>
            <Button icon={MessageCircle} className="!bg-green-600 hover:!bg-green-700" onClick={handleWhatsAppShare} fullWidth>
              WhatsApp
            </Button>
          </div>
        </Card>

        <Card variant="outlined" padding="p-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Butiran Jemputan</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Hartanah</span><span className="font-medium text-gray-800">{property?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bilik</span><span className="font-medium text-gray-800">{room?.label}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Sewa</span><span className="font-medium text-gray-800">RM{form.agreed_rent}/bulan</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Deposit</span><span className="font-medium text-gray-800">RM{form.deposit}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tarikh Masuk</span><span className="font-medium text-gray-800">{form.move_in}</span></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Jemputan tamat tempoh dalam 7 hari.</p>
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => { setInviteLink(null); setForm({ ...form, room_id: '', email: '' }) }}>
            Jemput Lagi
          </Button>
          <Button fullWidth onClick={() => navigate('/tenants')}>
            Selesai
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <h1 className="text-xl font-bold text-gray-800">Jemput Penyewa</h1>
      <p className="text-sm text-gray-500">Cipta pautan jemputan untuk penyewa mendaftar sendiri dan terikat ke unit ini.</p>

      <Card variant="elevated" padding="p-6" className="!rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Maklumat Penyewaan</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Hartanah *" required value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value, room_id: '' })}>
              <option value="">Pilih hartanah</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select label="Bilik *" required value={form.room_id}
              onChange={(e) => {
                const room = vacantRooms.find((r) => r.id === e.target.value)
                setForm({ ...form, room_id: e.target.value, agreed_rent: room ? String(room.rent_amount) : form.agreed_rent })
              }}>
              <option value="">Pilih bilik</option>
              {vacantRooms.map((r) => <option key={r.id} value={r.id}>{r.label} (RM{r.rent_amount})</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Sewa (RM) *" type="number" required value={form.agreed_rent}
              onChange={(e) => setForm({ ...form, agreed_rent: e.target.value })} />
            <Input label="Deposit (RM) *" type="number" required value={form.deposit}
              onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
            <Input label="Tarikh masuk *" type="date" required value={form.move_in}
              onChange={(e) => setForm({ ...form, move_in: e.target.value })} />
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pilihan</p>

          <Input label="Email penyewa (pilihan)" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            helperText="Jika diisi, penyewa boleh log masuk dengan email ini." />

          <Button type="submit" loading={loading} fullWidth size="lg">
            Cipta Jemputan
          </Button>
        </form>
      </Card>
    </div>
  )
}
