import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowLeft, Home, UserPlus, Pencil, Trash2 } from 'lucide-react'
import type { Property, Room, Tenancy, Profile } from '@/types/database'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
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

  // Edit property state
  const [editingProperty, setEditingProperty] = useState(false)
  const [editPropertyForm, setEditPropertyForm] = useState({ name: '', address: '', billing_date: 1 })

  // Edit room state
  const [editingRoom, setEditingRoom] = useState<RoomWithTenancy | null>(null)
  const [editRoomForm, setEditRoomForm] = useState({ label: '', rent_amount: '' })

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
      property_id: id!, label: newRoom.label, rent_amount: Number(newRoom.rent_amount),
      status: 'vacant', is_active: true,
    })
    setSaving(false)
    if (error) { toast.error('Gagal menambah bilik.'); return }
    toast.success('Bilik berjaya ditambah!')
    setNewRoom({ label: '', rent_amount: '' })
    setShowAddRoom(false)
    loadProperty()
  }

  // Edit property
  function openEditProperty() {
    if (!property) return
    setEditPropertyForm({ name: property.name, address: property.address, billing_date: property.billing_date })
    setEditingProperty(true)
  }

  async function handleSaveProperty() {
    setSaving(true)
    const { error } = await supabase.from('properties').update({
      name: editPropertyForm.name, address: editPropertyForm.address, billing_date: editPropertyForm.billing_date,
    }).eq('id', id!)
    setSaving(false)
    if (error) { toast.error('Gagal mengemaskini hartanah.'); return }
    toast.success('Hartanah dikemaskini!')
    setEditingProperty(false)
    loadProperty()
  }

  // Edit room
  function openEditRoom(room: RoomWithTenancy) {
    setEditRoomForm({ label: room.label, rent_amount: String(room.rent_amount) })
    setEditingRoom(room)
  }

  async function handleSaveRoom() {
    if (!editingRoom) return
    setSaving(true)
    const { error } = await supabase.from('rooms').update({
      label: editRoomForm.label, rent_amount: Number(editRoomForm.rent_amount),
    }).eq('id', editingRoom.id)
    setSaving(false)
    if (error) { toast.error('Gagal mengemaskini bilik.'); return }
    toast.success('Bilik dikemaskini!')
    setEditingRoom(null)
    loadProperty()
  }

  async function handleDeactivateRoom() {
    if (!editingRoom) return
    if (editingRoom.status === 'occupied') {
      toast.error('Tidak boleh nyahaktif bilik yang berisi.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('rooms').update({ is_active: false }).eq('id', editingRoom.id)
    setSaving(false)
    if (error) { toast.error('Gagal menyahaktif bilik.'); return }
    toast.success('Bilik dinyahaktifkan.')
    setEditingRoom(null)
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{property.name}</h1>
          <p className="text-sm text-gray-500">{property.address}</p>
          <p className="text-xs text-gray-400 mt-0.5">Bil: hari {property.billing_date} setiap bulan</p>
        </div>
        <Button variant="ghost" size="sm" icon={Pencil} onClick={openEditProperty}>
          Edit
        </Button>
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
                    <button onClick={() => openEditRoom(room)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      <Pencil size={14} />
                    </button>
                    {room.status === 'occupied' ? (
                      <StatusBadge status="occupied" label={activeTenancy?.tenant?.name || 'Berisi'} />
                    ) : (
                      <>
                        <StatusBadge status="vacant" />
                        <Link
                          to={`/tenants/new?room_id=${room.id}&property_id=${property.id}`}
                          className="text-primary-600 hover:text-primary-700 p-1"
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

      {/* Edit Property BottomSheet */}
      <BottomSheet open={editingProperty} onClose={() => setEditingProperty(false)} title="Edit Hartanah">
        <div className="space-y-4">
          <Input label="Nama hartanah" value={editPropertyForm.name}
            onChange={(e) => setEditPropertyForm({ ...editPropertyForm, name: e.target.value })} />
          <Input label="Alamat" value={editPropertyForm.address}
            onChange={(e) => setEditPropertyForm({ ...editPropertyForm, address: e.target.value })} />
          <Select label="Tarikh bil bulanan" value={editPropertyForm.billing_date}
            onChange={(e) => setEditPropertyForm({ ...editPropertyForm, billing_date: Number(e.target.value) })}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>Hari {d}</option>
            ))}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingProperty(false)}>Batal</Button>
            <Button className="flex-1" loading={saving} onClick={handleSaveProperty}>Simpan</Button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Room BottomSheet */}
      <BottomSheet open={!!editingRoom} onClose={() => setEditingRoom(null)} title="Edit Bilik">
        {editingRoom && (
          <div className="space-y-4">
            <Input label="Label bilik" value={editRoomForm.label}
              onChange={(e) => setEditRoomForm({ ...editRoomForm, label: e.target.value })} />
            <Input label="Sewa bulanan (RM)" type="number" value={editRoomForm.rent_amount}
              onChange={(e) => setEditRoomForm({ ...editRoomForm, rent_amount: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditingRoom(null)}>Batal</Button>
              <Button className="flex-1" loading={saving} onClick={handleSaveRoom}>Simpan</Button>
            </div>

            {/* Deactivate — only for vacant rooms */}
            {editingRoom.status === 'vacant' && (
              <div className="pt-3 border-t border-gray-100">
                <Button variant="danger" fullWidth size="sm" icon={Trash2} onClick={handleDeactivateRoom} loading={saving}>
                  Nyahaktif Bilik
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">Sejarah bilik akan dikekalkan</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
