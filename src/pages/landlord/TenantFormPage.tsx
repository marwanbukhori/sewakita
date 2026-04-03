import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
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
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    ic_number: '',
    emergency_contact: '',
    property_id: preselectedPropertyId || '',
    room_id: preselectedRoomId || '',
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

    const tenantId = crypto.randomUUID()
    const { error: profileError } = await supabase.from('profiles').insert({
      id: tenantId,
      auth_id: tenantId,
      role: 'tenant',
      name: form.name,
      email: form.email,
      phone: form.phone,
      ic_number: form.ic_number || undefined,
      emergency_contact: form.emergency_contact || undefined,
    })

    if (profileError) {
      toast.error('Gagal menambah penyewa.')
      setLoading(false)
      return
    }

    const { error: tenancyError } = await supabase.from('tenancies').insert({
      tenant_id: tenantId,
      room_id: form.room_id,
      move_in: form.move_in,
      deposit: Number(form.deposit),
      agreed_rent: Number(form.agreed_rent),
      status: 'active',
    })

    if (tenancyError) {
      toast.error('Gagal membuat penyewaan.')
      setLoading(false)
      return
    }

    await supabase.from('rooms').update({ status: 'occupied' }).eq('id', form.room_id)

    setLoading(false)
    toast.success('Penyewa berjaya ditambah!')
    navigate('/tenants')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <h1 className="text-xl font-bold text-gray-800">Tambah Penyewa</h1>

      <Card variant="elevated" padding="p-6" className="!rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Maklumat Penyewa</p>

          <Input label="Nama penuh *" type="text" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email *" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="No. telefon *" type="tel" required value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="No. IC (pilihan)" type="text" value={form.ic_number}
              onChange={(e) => setForm({ ...form, ic_number: e.target.value })} />
            <Input label="Kecemasan (pilihan)" type="text" value={form.emergency_contact}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
          </div>

          <hr className="border-gray-100" />
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

          <Button type="submit" loading={loading} fullWidth size="lg">
            Simpan Penyewa
          </Button>
        </form>
      </Card>
    </div>
  )
}
