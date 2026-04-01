import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowLeft, Home, UserPlus } from 'lucide-react'
import type { Property, Room, Tenancy, Profile } from '@/types/database'
import toast from 'react-hot-toast'

interface RoomWithTenancy extends Room {
  tenancies: (Tenancy & { tenant: Profile })[]
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [rooms, setRooms] = useState<RoomWithTenancy[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [newRoom, setNewRoom] = useState({ label: '', rent_amount: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) loadProperty()
  }, [id])

  async function loadProperty() {
    const [{ data: prop }, { data: roomsData }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', id!).single(),
      supabase
        .from('rooms')
        .select('*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*))')
        .eq('property_id', id!)
        .eq('is_active', true)
        .order('label'),
    ])

    setProperty(prop)
    setRooms((roomsData as RoomWithTenancy[]) || [])
    setLoading(false)
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('rooms').insert({
      property_id: id!,
      label: newRoom.label,
      rent_amount: Number(newRoom.rent_amount),
      status: 'vacant',
      is_active: true,
    })
    setSaving(false)

    if (error) {
      toast.error('Gagal menambah bilik.')
      return
    }

    toast.success('Bilik berjaya ditambah!')
    setNewRoom({ label: '', rent_amount: '' })
    setShowAddRoom(false)
    loadProperty()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  if (!property) {
    return <div className="text-center py-12 text-gray-500">Hartanah tidak dijumpai.</div>
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/properties')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Semua Hartanah
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-sm text-gray-500">{property.address}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Bilik ({rooms.length})</h2>
        <button
          onClick={() => setShowAddRoom(true)}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <Plus size={16} /> Tambah Bilik
        </button>
      </div>

      {showAddRoom && (
        <form onSubmit={handleAddRoom} className="bg-primary-50 rounded-xl border border-primary-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newRoom.label}
              onChange={(e) => setNewRoom({ ...newRoom, label: e.target.value })}
              placeholder="Label (cth: Bilik A)"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="number"
              required
              value={newRoom.rent_amount}
              onChange={(e) => setNewRoom({ ...newRoom, rent_amount: e.target.value })}
              placeholder="Sewa (RM)"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAddRoom(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Batal
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Home className="mx-auto text-gray-300 mb-3" size={32} />
          <p className="text-gray-500 text-sm">Tiada bilik lagi. Tambah bilik pertama.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rooms.map((room) => {
            const activeTenancy = room.tenancies?.find((t) => t.status === 'active')
            return (
              <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{room.label}</h3>
                    <p className="text-sm text-gray-500">RM{room.rent_amount}/bulan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.status === 'occupied' ? (
                      <span className="text-xs bg-success-50 text-green-700 px-2 py-1 rounded-full font-medium">
                        {activeTenancy?.tenant?.name || 'Berisi'}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Kosong</span>
                        <Link
                          to={`/tenants/new?room_id=${room.id}&property_id=${property.id}`}
                          className="text-primary-600 hover:text-primary-700"
                          title="Tambah penyewa"
                        >
                          <UserPlus size={18} />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
