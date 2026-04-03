import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt, Plus, ChevronDown, ChevronUp, Zap, Droplets, Wifi, ArrowLeft } from 'lucide-react'
import type { Property, Room, UtilityBill, MonthlyBill, Tenancy, Profile, SplitMethod, UtilityType } from '@/types/database'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonList } from '@/components/ui/Skeleton'

const UTILITY_ICONS = { electric: Zap, water: Droplets, internet: Wifi }
const UTILITY_LABELS = { electric: 'Elektrik (TNB)', water: 'Air (SYABAS)', internet: 'Internet' }

export default function BillingPage() {
  const { profile } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [showUtilityForm, setShowUtilityForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [utilityForm, setUtilityForm] = useState({
    type: 'electric' as UtilityType,
    total_amount: '',
    split_method: 'sub_meter' as SplitMethod,
    readings: {} as Record<string, string>,
    fixed_amount: '',
  })

  const [rooms, setRooms] = useState<(Room & { tenancies: (Tenancy & { tenant: Profile })[] })[]>([])
  const [existingUtilities, setExistingUtilities] = useState<UtilityBill[]>([])

  useEffect(() => {
    if (!profile) return
    loadProperties()
  }, [profile])

  useEffect(() => {
    if (selectedProperty) {
      loadRooms()
      loadBills()
      loadUtilities()
    }
  }, [selectedProperty, month])

  async function loadProperties() {
    const { data } = await supabase
      .from('properties').select('*').eq('landlord_id', profile!.id).eq('is_active', true)
    setProperties(data || [])
    if (data?.length) setSelectedProperty(data[0].id)
    setLoading(false)
  }

  async function loadRooms() {
    const { data } = await supabase
      .from('rooms').select('*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*))')
      .eq('property_id', selectedProperty).eq('is_active', true).order('label')
    setRooms(data || [])
  }

  async function loadBills() {
    const { data } = await supabase
      .from('monthly_bills').select('*').eq('property_id', selectedProperty).eq('month', month)
    setBills(data || [])
  }

  async function loadUtilities() {
    const { data } = await supabase
      .from('utility_bills').select('*').eq('property_id', selectedProperty).eq('month', month)
    setExistingUtilities(data || [])
  }

  async function handleSaveUtility(e: React.FormEvent) {
    e.preventDefault()
    const readings = utilityForm.split_method === 'sub_meter'
      ? Object.entries(utilityForm.readings).map(([room_id, reading]) => ({ room_id, reading: Number(reading) }))
      : undefined

    const { error } = await supabase.from('utility_bills').insert({
      property_id: selectedProperty,
      month,
      type: utilityForm.type,
      total_amount: Number(utilityForm.total_amount),
      split_method: utilityForm.split_method,
      per_room_readings: readings,
      fixed_amount_per_room: utilityForm.split_method === 'fixed' ? Number(utilityForm.fixed_amount) : undefined,
    })

    if (error) { toast.error('Gagal menyimpan bil utiliti.'); return }
    toast.success('Bil utiliti disimpan!')
    setShowUtilityForm(false)
    setUtilityForm({ type: 'electric', total_amount: '', split_method: 'sub_meter', readings: {}, fixed_amount: '' })
    loadUtilities()
  }

  async function handleGenerateBills() {
    setGenerating(true)
    const occupiedRooms = rooms.filter((r) => r.status === 'occupied')

    for (const room of occupiedRooms) {
      const activeTenancy = room.tenancies?.find((t) => t.status === 'active')
      if (!activeTenancy) continue

      const moveInDate = new Date(activeTenancy.move_in)
      const billMonth = new Date(month + '-01')
      let rentAmount = activeTenancy.agreed_rent

      if (moveInDate.getFullYear() === billMonth.getFullYear() && moveInDate.getMonth() === billMonth.getMonth()) {
        const daysInMonth = new Date(billMonth.getFullYear(), billMonth.getMonth() + 1, 0).getDate()
        const remainingDays = daysInMonth - moveInDate.getDate() + 1
        rentAmount = Math.round((activeTenancy.agreed_rent * remainingDays) / daysInMonth)
      }

      const utilityBreakdown = existingUtilities.map((ub) => {
        let amount = 0
        if (ub.split_method === 'absorbed') amount = 0
        else if (ub.split_method === 'equal') amount = Math.round(ub.total_amount / occupiedRooms.length)
        else if (ub.split_method === 'fixed') amount = ub.fixed_amount_per_room || 0
        else if (ub.split_method === 'sub_meter' && ub.per_room_readings) {
          const totalReadings = ub.per_room_readings.reduce((s, r) => s + r.reading, 0)
          const roomReading = ub.per_room_readings.find((r) => r.room_id === room.id)
          if (roomReading && totalReadings > 0) amount = Math.round((roomReading.reading / totalReadings) * ub.total_amount)
        }
        return { type: ub.type, amount, split_method: ub.split_method }
      })

      const totalDue = rentAmount + utilityBreakdown.reduce((s, u) => s + u.amount, 0)
      const existing = bills.find((b) => b.room_id === room.id && b.tenant_id === activeTenancy.tenant_id)
      if (existing) continue

      await supabase.from('monthly_bills').insert({
        tenant_id: activeTenancy.tenant_id, room_id: room.id, property_id: selectedProperty,
        month, rent_amount: rentAmount, utility_breakdown: utilityBreakdown,
        total_due: totalDue, total_paid: 0, status: 'pending',
      })
    }

    setGenerating(false)
    toast.success('Bil bulanan berjaya dijana!')
    loadBills()
  }

  if (loading) return <SkeletonList count={2} />

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied')

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} icon={ArrowLeft} className="sm:hidden">
        Kembali
      </Button>
      <h1 className="text-xl font-bold text-gray-800">Bil Bulanan</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="flex-1">
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="!w-auto" />
      </div>

      {/* Utility bills */}
      <Card variant="elevated" padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">Bil Utiliti</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowUtilityForm(!showUtilityForm)}
            icon={showUtilityForm ? ChevronUp : Plus}>
            {showUtilityForm ? 'Tutup' : 'Tambah'}
          </Button>
        </div>

        {existingUtilities.length > 0 && (
          <div className="space-y-2 mb-4">
            {existingUtilities.map((ub) => {
              const Icon = UTILITY_ICONS[ub.type]
              return (
                <div key={ub.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                      <Icon size={16} className="text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{UTILITY_LABELS[ub.type]}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">RM{ub.total_amount}</span>
                </div>
              )
            })}
          </div>
        )}

        {showUtilityForm && (
          <form onSubmit={handleSaveUtility} className="space-y-3 bg-primary-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <Select value={utilityForm.type} onChange={(e) => setUtilityForm({ ...utilityForm, type: e.target.value as UtilityType })}>
                <option value="electric">Elektrik (TNB)</option>
                <option value="water">Air (SYABAS)</option>
                <option value="internet">Internet</option>
              </Select>
              <Input type="number" required placeholder="Jumlah (RM)" value={utilityForm.total_amount}
                onChange={(e) => setUtilityForm({ ...utilityForm, total_amount: e.target.value })} />
            </div>

            <Select value={utilityForm.split_method} onChange={(e) => setUtilityForm({ ...utilityForm, split_method: e.target.value as SplitMethod })}>
              <option value="sub_meter">Sub-meter (kWh per bilik)</option>
              <option value="equal">Bahagi sama rata</option>
              <option value="fixed">Jumlah tetap per bilik</option>
              <option value="absorbed">Tuan rumah tanggung</option>
            </Select>

            {utilityForm.split_method === 'sub_meter' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">Masukkan bacaan meter per bilik:</p>
                {occupiedRooms.map((room) => (
                  <div key={room.id} className="flex items-center gap-2">
                    <span className="text-sm w-24 text-gray-700 font-medium">{room.label}</span>
                    <Input type="number" placeholder="kWh"
                      value={utilityForm.readings[room.id] || ''}
                      onChange={(e) => setUtilityForm({
                        ...utilityForm, readings: { ...utilityForm.readings, [room.id]: e.target.value },
                      })} />
                  </div>
                ))}
              </div>
            )}

            {utilityForm.split_method === 'fixed' && (
              <Input type="number" required placeholder="Jumlah tetap per bilik (RM)" value={utilityForm.fixed_amount}
                onChange={(e) => setUtilityForm({ ...utilityForm, fixed_amount: e.target.value })} />
            )}

            <Button type="submit" fullWidth>Simpan Bil Utiliti</Button>
          </form>
        )}
      </Card>

      {/* Generate & view bills */}
      <Card variant="elevated" padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">Bil Penyewa ({month})</h2>
          <Button size="sm" icon={Receipt} loading={generating} onClick={handleGenerateBills}>
            Jana Bil
          </Button>
        </div>

        {bills.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Tiada bil lagi untuk bulan ini. Jana bil selepas memasukkan bil utiliti.</p>
        ) : (
          <div className="space-y-2">
            {bills.map((bill) => {
              const room = rooms.find((r) => r.id === bill.room_id)
              const tenant = room?.tenancies?.find((t) => t.status === 'active')?.tenant
              return (
                <div key={bill.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{tenant?.name || 'Penyewa'}</div>
                    <div className="text-xs text-gray-500">{room?.label} — Sewa: RM{bill.rent_amount}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">RM{bill.total_due}</span>
                    <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
