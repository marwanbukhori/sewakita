import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt, Plus, ChevronDown, ChevronUp, Zap, Droplets, Wifi } from 'lucide-react'
import type { Property, Room, UtilityBill, MonthlyBill, Tenancy, Profile, SplitMethod, UtilityType } from '@/types/database'
import toast from 'react-hot-toast'

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
      .from('properties')
      .select('*')
      .eq('landlord_id', profile!.id)
      .eq('is_active', true)

    setProperties(data || [])
    if (data?.length) setSelectedProperty(data[0].id)
    setLoading(false)
  }

  async function loadRooms() {
    const { data } = await supabase
      .from('rooms')
      .select('*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*))')
      .eq('property_id', selectedProperty)
      .eq('is_active', true)
      .order('label')

    setRooms(data || [])
  }

  async function loadBills() {
    const { data } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('property_id', selectedProperty)
      .eq('month', month)

    setBills(data || [])
  }

  async function loadUtilities() {
    const { data } = await supabase
      .from('utility_bills')
      .select('*')
      .eq('property_id', selectedProperty)
      .eq('month', month)

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

      // Calculate proration for mid-month move-ins
      const moveInDate = new Date(activeTenancy.move_in)
      const billMonth = new Date(month + '-01')
      let rentAmount = activeTenancy.agreed_rent

      if (moveInDate.getFullYear() === billMonth.getFullYear() && moveInDate.getMonth() === billMonth.getMonth()) {
        const daysInMonth = new Date(billMonth.getFullYear(), billMonth.getMonth() + 1, 0).getDate()
        const remainingDays = daysInMonth - moveInDate.getDate() + 1
        rentAmount = Math.round((activeTenancy.agreed_rent * remainingDays) / daysInMonth)
      }

      // Calculate utility shares
      const utilityBreakdown = existingUtilities.map((ub) => {
        let amount = 0
        if (ub.split_method === 'absorbed') {
          amount = 0
        } else if (ub.split_method === 'equal') {
          amount = Math.round(ub.total_amount / occupiedRooms.length)
        } else if (ub.split_method === 'fixed') {
          amount = ub.fixed_amount_per_room || 0
        } else if (ub.split_method === 'sub_meter' && ub.per_room_readings) {
          const totalReadings = ub.per_room_readings.reduce((s, r) => s + r.reading, 0)
          const roomReading = ub.per_room_readings.find((r) => r.room_id === room.id)
          if (roomReading && totalReadings > 0) {
            amount = Math.round((roomReading.reading / totalReadings) * ub.total_amount)
          }
        }
        return { type: ub.type, amount, split_method: ub.split_method }
      })

      const totalDue = rentAmount + utilityBreakdown.reduce((s, u) => s + u.amount, 0)

      // Check if bill already exists
      const existing = bills.find((b) => b.room_id === room.id && b.tenant_id === activeTenancy.tenant_id)
      if (existing) continue

      await supabase.from('monthly_bills').insert({
        tenant_id: activeTenancy.tenant_id,
        room_id: room.id,
        property_id: selectedProperty,
        month,
        rent_amount: rentAmount,
        utility_breakdown: utilityBreakdown,
        total_due: totalDue,
        total_paid: 0,
        status: 'pending',
      })
    }

    setGenerating(false)
    toast.success('Bil bulanan berjaya dijana!')
    loadBills()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Bil Bulanan</h1>

      <div className="flex gap-3">
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Utility bills section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Bil Utiliti</h2>
          <button
            onClick={() => setShowUtilityForm(!showUtilityForm)}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {showUtilityForm ? <ChevronUp size={16} /> : <Plus size={16} />}
            {showUtilityForm ? 'Tutup' : 'Tambah'}
          </button>
        </div>

        {existingUtilities.length > 0 && (
          <div className="space-y-2 mb-3">
            {existingUtilities.map((ub) => {
              const Icon = UTILITY_ICONS[ub.type]
              return (
                <div key={ub.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-primary-600" />
                    <span className="text-sm">{UTILITY_LABELS[ub.type]}</span>
                  </div>
                  <div className="text-sm font-medium">RM{ub.total_amount}</div>
                </div>
              )
            })}
          </div>
        )}

        {showUtilityForm && (
          <form onSubmit={handleSaveUtility} className="space-y-3 bg-primary-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <select value={utilityForm.type} onChange={(e) => setUtilityForm({ ...utilityForm, type: e.target.value as UtilityType })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="electric">Elektrik (TNB)</option>
                <option value="water">Air (SYABAS)</option>
                <option value="internet">Internet</option>
              </select>
              <input type="number" required placeholder="Jumlah (RM)" value={utilityForm.total_amount}
                onChange={(e) => setUtilityForm({ ...utilityForm, total_amount: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>

            <select value={utilityForm.split_method} onChange={(e) => setUtilityForm({ ...utilityForm, split_method: e.target.value as SplitMethod })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="sub_meter">Sub-meter (kWh per bilik)</option>
              <option value="equal">Bahagi sama rata</option>
              <option value="fixed">Jumlah tetap per bilik</option>
              <option value="absorbed">Tuan rumah tanggung</option>
            </select>

            {utilityForm.split_method === 'sub_meter' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">Masukkan bacaan meter per bilik:</p>
                {occupiedRooms.map((room) => (
                  <div key={room.id} className="flex items-center gap-2">
                    <span className="text-sm w-24 text-gray-700">{room.label}</span>
                    <input type="number" placeholder="kWh"
                      value={utilityForm.readings[room.id] || ''}
                      onChange={(e) => setUtilityForm({
                        ...utilityForm,
                        readings: { ...utilityForm.readings, [room.id]: e.target.value },
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                ))}
              </div>
            )}

            {utilityForm.split_method === 'fixed' && (
              <input type="number" required placeholder="Jumlah tetap per bilik (RM)" value={utilityForm.fixed_amount}
                onChange={(e) => setUtilityForm({ ...utilityForm, fixed_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            )}

            <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
              Simpan Bil Utiliti
            </button>
          </form>
        )}
      </div>

      {/* Generate & view bills */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Bil Penyewa ({month})</h2>
          <button
            onClick={handleGenerateBills}
            disabled={generating}
            className="flex items-center gap-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            <Receipt size={14} />
            {generating ? 'Menjana...' : 'Jana Bil'}
          </button>
        </div>

        {bills.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Tiada bil lagi untuk bulan ini. Jana bil selepas memasukkan bil utiliti.</p>
        ) : (
          <div className="space-y-2">
            {bills.map((bill) => {
              const room = rooms.find((r) => r.id === bill.room_id)
              const tenant = room?.tenancies?.find((t) => t.status === 'active')?.tenant
              return (
                <div key={bill.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tenant?.name || 'Penyewa'}</div>
                    <div className="text-xs text-gray-500">{room?.label} — Sewa: RM{bill.rent_amount}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">RM{bill.total_due}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      bill.status === 'paid' ? 'bg-success-50 text-green-700' :
                      bill.status === 'overdue' ? 'bg-danger-50 text-red-700' :
                      bill.status === 'partial' ? 'bg-warning-50 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {bill.status === 'paid' ? 'Dibayar' :
                       bill.status === 'overdue' ? 'Tertunggak' :
                       bill.status === 'partial' ? 'Separa' : 'Belum bayar'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
