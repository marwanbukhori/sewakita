import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowLeft, Home, UserPlus } from 'lucide-react'
import type { Property, Room, Tenancy, Profile } from '@/types/database'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'

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

  if (loading) return <SkeletonList count={3} />

  if (!property) {
    return <div className="text-center py-12 text-gray-500">Hartanah tidak dijumpai.</div>
  }

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate('/properties')} icon={ArrowLeft}>
        Semua Hartanah
      </Button>

      <div>
        <h1 className="text-xl font-bold text-gray-800">{property.name}</h1>
        <p className="text-sm text-gray-500">{property.address}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Bilik ({rooms.length})</h2>
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowAddRoom(true)}>
          Tambah
        </Button>
      </div>

      {showAddRoom && (
        <Card variant="outlined" padding="p-4" className="bg-primary-50 !border-primary-200">
          <form onSubmit={handleAddRoom} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input type="text" required value={newRoom.label}
                onChange={(e) => setNewRoom({ ...newRoom, label: e.target.value })}
                placeholder="Label (cth: Bilik A)" />
              <Input type="number" required value={newRoom.rent_amount}
                onChange={(e) => setNewRoom({ ...newRoom, rent_amount: e.target.value })}
                placeholder="Sewa (RM)" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddRoom(false)}>Batal</Button>
              <Button type="submit" size="sm" loading={saving}>Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {rooms.length === 0 ? (
        <EmptyState icon={Home} title="Tiada bilik lagi" description="Tambah bilik pertama." />
      ) : (
        <div className="grid gap-3">
          {rooms.map((room) => {
            const activeTenancy = room.tenancies?.find((t) => t.status === 'active')
            return (
              <Card key={room.id} variant="default" padding="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{room.label}</h3>
                    <p className="text-sm text-gray-500">RM{room.rent_amount}/bulan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.status === 'occupied' ? (
                      <StatusBadge status="occupied" label={activeTenancy?.tenant?.name || 'Berisi'} />
                    ) : (
                      <>
                        <StatusBadge status="vacant" />
                        <Link
                          to={`/tenants/new?room_id=${room.id}&property_id=${property.id}`}
                          className="text-primary-600 hover:text-primary-700 p-1"
                          title="Tambah penyewa"
                        >
                          <UserPlus size={18} />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
