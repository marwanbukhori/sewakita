import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import type { Property, Room } from '@/types/database'

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

    // Auto-set rent if room is preselected
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

    // 1. Create or find the tenant profile
    const tenantId = crypto.randomUUID()
    const { error: profileError } = await supabase.from('profiles').insert({
      id: tenantId,
      auth_id: tenantId, // placeholder — will be linked when tenant logs in
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

    // 2. Create tenancy
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

    // 3. Update room status
    await supabase.from('rooms').update({ status: 'occupied' }).eq('id', form.room_id)

    setLoading(false)
    toast.success('Penyewa berjaya ditambah!')
    navigate('/tenants')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Kembali
      </button>

      <h1 className="text-xl font-bold text-gray-900">Tambah Penyewa</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Maklumat Penyewa</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama penuh *</label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. telefon *</label>
            <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. IC <span className="text-gray-400">(pilihan)</span></label>
            <input type="text" value={form.ic_number} onChange={(e) => setForm({ ...form, ic_number: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kecemasan <span className="text-gray-400">(pilihan)</span></label>
            <input type="text" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <hr className="border-gray-200" />
        <h2 className="text-sm font-semibold text-gray-700">Maklumat Penyewaan</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hartanah *</label>
            <select required value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value, room_id: '' })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="">Pilih hartanah</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bilik *</label>
            <select required value={form.room_id} onChange={(e) => {
              const room = vacantRooms.find((r) => r.id === e.target.value)
              setForm({ ...form, room_id: e.target.value, agreed_rent: room ? String(room.rent_amount) : form.agreed_rent })
            }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="">Pilih bilik</option>
              {vacantRooms.map((r) => <option key={r.id} value={r.id}>{r.label} (RM{r.rent_amount})</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sewa (RM) *</label>
            <input type="number" required value={form.agreed_rent} onChange={(e) => setForm({ ...form, agreed_rent: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (RM) *</label>
            <input type="number" required value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Masuk *</label>
            <input type="date" required value={form.move_in} onChange={(e) => setForm({ ...form, move_in: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
          {loading ? 'Menyimpan...' : 'Simpan Penyewa'}
        </button>
      </form>
    </div>
  )
}
