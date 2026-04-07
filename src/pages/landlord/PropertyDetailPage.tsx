import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Clock, XCircle, Home } from 'lucide-react'
import { format } from 'date-fns'
import type { Property, Room, Tenancy, Profile, Invite, MonthlyBill } from '@/types/database'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import { SkeletonList } from '@/components/ui/Skeleton'
import { BatikHeroOverlay } from '@/assets/batik/patterns'
import RoomDetailSheet from '@/components/property/RoomDetailSheet'

interface RoomWithTenancy extends Room {
  tenancies: (Tenancy & { tenant: Profile })[]
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [property, setProperty] = useState<Property | null>(null)
  const [rooms, setRooms] = useState<RoomWithTenancy[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([])
  const [collectionRate, setCollectionRate] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState<RoomWithTenancy | null>(null)

  // Add room state
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
      supabase.from('rooms').select('*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*))')
        .eq('property_id', id!).eq('is_active', true).order('label'),
    ])

    setProperty(prop)
    setRooms((roomsData as RoomWithTenancy[]) || [])

    const { data: invitesData } = await supabase
      .from('invites').select('*').eq('property_id', id!).eq('status', 'pending')
    setPendingInvites(invitesData || [])

    // Collection rate for current month
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: bills } = await supabase
      .from('monthly_bills').select('total_due, total_paid').eq('property_id', id!).eq('month', currentMonth)
    const billRows = (bills || []) as { total_due: number; total_paid: number }[]
    const totalDue = billRows.reduce((s, b) => s + b.total_due, 0)
    const totalPaid = billRows.reduce((s, b) => s + b.total_paid, 0)
    setCollectionRate(totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0)

    setLoading(false)
  }

  // Property edit handlers
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
    if (error) { toast.error(t('properties.failed_update_property')); return }
    toast.success(t('properties.property_updated'))
    setEditingProperty(false)
    loadProperty()
  }

  // Room handlers
  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('rooms').insert({
      property_id: id!, label: newRoom.label, rent_amount: Number(newRoom.rent_amount),
      status: 'vacant', is_active: true,
    })
    setSaving(false)
    if (error) { toast.error(t('properties.failed_add_room')); return }
    toast.success(t('properties.room_added'))
    setNewRoom({ label: '', rent_amount: '' })
    setShowAddRoom(false)
    loadProperty()
  }

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
    if (error) { toast.error(t('properties.failed_update_room')); return }
    toast.success(t('properties.room_updated'))
    setEditingRoom(null)
    loadProperty()
  }

  async function handleDeactivateRoom() {
    if (!editingRoom) return
    if (editingRoom.status === 'occupied') {
      toast.error(t('properties.cannot_deactivate_occupied'))
      return
    }
    setSaving(true)
    const { error } = await supabase.from('rooms').update({ is_active: false }).eq('id', editingRoom.id)
    setSaving(false)
    if (error) { toast.error(t('properties.failed_deactivate_room')); return }
    toast.success(t('properties.room_deactivated'))
    setEditingRoom(null)
    loadProperty()
  }

  if (loading) return <SkeletonList count={3} />
  if (!property) return <div className="text-center py-12 text-gray-500">{t('properties.not_found')}</div>

  const occupied = rooms.filter(r => r.status === 'occupied').length
  const monthlyIncome = rooms.filter(r => r.status === 'occupied').reduce((s, r) => s + r.rent_amount, 0)
  const occupancyPct = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0

  return (
    <div className="space-y-4 animate-in -mx-4 sm:mx-0">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-5 pt-5 pb-5 sm:rounded-2xl overflow-hidden shadow-md">
        <BatikHeroOverlay className="!opacity-[0.08]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/properties')} className="text-white/80 text-sm hover:text-white">
              ← {t('properties.all_properties', 'Hartanah')}
            </button>
            <button onClick={openEditProperty} className="text-white/80 text-sm hover:text-white flex items-center gap-1">
              <Pencil size={14} /> Edit
            </button>
          </div>
          <h1 className="text-xl font-bold text-white">{property.name}</h1>
          <p className="text-sm text-white/70 mt-1">📍 {property.address}</p>
          <p className="text-xs text-white/50 mt-1">📅 {t('properties.billing_day', { day: property.billing_date })}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-2 px-4 sm:px-0">
        <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-gray-500 font-medium">{t('reports.occupancy', 'Penghunian')}</p>
          <p className="text-lg font-bold text-primary-700">{occupied}/{rooms.length}</p>
          <p className="text-[10px] text-gray-400">{occupancyPct}%</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-gray-500 font-medium">{t('reports.monthly_income', 'Pendapatan')}</p>
          <p className="text-lg font-bold text-gray-800">RM{monthlyIncome.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">/bulan</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-gray-500 font-medium">{t('reports.collection_rate', 'Kutipan')}</p>
          <p className={`text-lg font-bold ${collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {collectionRate}%
          </p>
          <p className="text-[10px] text-gray-400">{t('billing.this_month', 'Bulan ini')}</p>
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between px-4 sm:px-0">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {t('properties.rooms')} ({rooms.length})
        </h2>
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowAddRoom(true)}>
          {t('common.add')}
        </Button>
      </div>

      {/* Add room form */}
      {showAddRoom && (
        <div className="px-4 sm:px-0">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <form onSubmit={handleAddRoom} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input type="text" required value={newRoom.label}
                  onChange={e => setNewRoom({ ...newRoom, label: e.target.value })}
                  placeholder={t('properties.room_label')} />
                <Input type="number" required value={newRoom.rent_amount}
                  onChange={e => setNewRoom({ ...newRoom, rent_amount: e.target.value })}
                  placeholder={t('properties.room_rent')} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddRoom(false)}>{t('common.cancel')}</Button>
                <Button type="submit" size="sm" loading={saving}>{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room grid */}
      <div className="px-4 sm:px-0">
        {rooms.length === 0 ? (
          <EmptyState icon={Home} title={t('properties.no_rooms')} description={t('properties.add_first_room')} />
        ) : (
          <div className="space-y-3">
            {rooms.map(room => {
              const activeTenancy = room.tenancies?.find(t => t.status === 'active')
              const tenant = activeTenancy?.tenant
              const isOccupied = room.status === 'occupied' && tenant
              const roomInvites = pendingInvites.filter(inv => inv.room_id === room.id)

              if (isOccupied) {
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className="w-full flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 active:scale-[0.98] transition-all text-left"
                  >
                    {/* Green accent */}
                    <div className="w-1 h-12 rounded-full bg-green-500 shrink-0" />
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {tenant.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">{room.label}</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">{t('properties.occupied', 'Dihuni')}</span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">{tenant.name}</p>
                      <p className="text-[11px] text-gray-400">RM{room.rent_amount}/bln · 📱 {tenant.phone || '—'}</p>
                    </div>
                    <span className="text-gray-300 text-lg">›</span>
                  </button>
                )
              }

              // Vacant room
              return (
                <div key={room.id} className="bg-white rounded-xl p-3.5 border border-dashed border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full bg-gray-300 shrink-0" />
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-medium shrink-0">?</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">{room.label}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">{t('properties.vacant', 'Kosong')}</span>
                        <button onClick={(e) => { e.stopPropagation(); openEditRoom(room) }} className="p-1 rounded text-gray-300 hover:text-gray-500">
                          <Pencil size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-400">{t('properties.no_tenant', 'Tiada penyewa')}</p>
                      <p className="text-[11px] text-gray-400">RM{room.rent_amount}/bln</p>
                    </div>
                    <Link to={`/tenants/new?room_id=${room.id}&property_id=${property.id}`}
                      className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 shrink-0">
                      + {t('properties.invite_short', 'Jemput')}
                    </Link>
                  </div>

                  {/* Pending invites */}
                  {roomInvites.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {roomInvites.map(inv => (
                        <div key={inv.id} className="flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                          <Clock size={12} className="text-amber-600 shrink-0" />
                          <p className="text-[11px] text-amber-700 flex-1 truncate">
                            {inv.email || t('properties.no_email')} · {t('properties.expires', { date: format(new Date(inv.expires_at), 'dd MMM') })}
                          </p>
                          <button onClick={() => {
                            supabase.from('invites').update({ status: 'revoked' }).eq('id', inv.id)
                              .then(() => { toast.success(t('properties.invite_revoked')); loadProperty() })
                          }} className="p-0.5 text-amber-500 hover:text-red-500">
                            <XCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Room detail bottom sheet */}
      <RoomDetailSheet
        open={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        room={selectedRoom}
        property={property}
        pendingInvites={pendingInvites}
        onRefresh={loadProperty}
      />

      {/* Edit Property BottomSheet */}
      <BottomSheet open={editingProperty} onClose={() => setEditingProperty(false)} title={t('properties.edit_property')}>
        <div className="space-y-4">
          <Input label={t('properties.name')} value={editPropertyForm.name}
            onChange={e => setEditPropertyForm({ ...editPropertyForm, name: e.target.value })} />
          <Input label={t('properties.address')} value={editPropertyForm.address}
            onChange={e => setEditPropertyForm({ ...editPropertyForm, address: e.target.value })} />
          <Select label={t('properties.billing_date')} value={editPropertyForm.billing_date}
            onChange={e => setEditPropertyForm({ ...editPropertyForm, billing_date: Number(e.target.value) })}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{t('properties.day', { day: d })}</option>
            ))}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingProperty(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={saving} onClick={handleSaveProperty}>{t('common.save')}</Button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Room BottomSheet */}
      <BottomSheet open={!!editingRoom} onClose={() => setEditingRoom(null)} title={t('properties.edit_room')}>
        {editingRoom && (
          <div className="space-y-4">
            <Input label={t('properties.room_label_edit')} value={editRoomForm.label}
              onChange={e => setEditRoomForm({ ...editRoomForm, label: e.target.value })} />
            <Input label={t('properties.room_rent_edit')} type="number" value={editRoomForm.rent_amount}
              onChange={e => setEditRoomForm({ ...editRoomForm, rent_amount: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditingRoom(null)}>{t('common.cancel')}</Button>
              <Button className="flex-1" loading={saving} onClick={handleSaveRoom}>{t('common.save')}</Button>
            </div>
            {editingRoom.status === 'vacant' && (
              <div className="pt-3 border-t border-gray-100">
                <Button variant="danger" fullWidth size="sm" onClick={handleDeactivateRoom} loading={saving}>
                  {t('properties.deactivate_room')}
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">{t('properties.deactivate_warning')}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
