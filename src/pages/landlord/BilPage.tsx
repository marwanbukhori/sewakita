import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Check, MessageCircle, ChevronDown, ChevronUp, Receipt, Plus, Zap, Droplets, Wifi } from 'lucide-react'
import type { MonthlyBill, Property, Room, Profile, PaymentMethod, Tenancy, UtilityBill, SplitMethod, UtilityType, UtilityTemplate } from '@/types/database'
import toast from 'react-hot-toast'
import { generateBillMessage, generateReminderMessage, generateReceiptMessage } from '@/lib/whatsapp'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { SkeletonList } from '@/components/ui/Skeleton'

interface BillWithDetails extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
}

type StatusFilter = 'all' | 'overdue' | 'pending' | 'paid'
type Tab = 'bills' | 'generate'

const UTILITY_ICONS: Record<string, typeof Zap> = { electric: Zap, water: Droplets, internet: Wifi }
const UTILITY_LABELS: Record<string, string> = { electric: 'Elektrik (TNB)', water: 'Air (SYABAS)', internet: 'Internet' }

export default function BilPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('bills')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)

  // Bills tab state
  const [bills, setBills] = useState<BillWithDetails[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
  const [paymentModal, setPaymentModal] = useState<{ bill: BillWithDetails; amount: string; method: PaymentMethod } | null>(null)

  // Generate tab state
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [rooms, setRooms] = useState<(Room & { tenancies: (Tenancy & { tenant: Profile })[] })[]>([])
  const [existingUtilities, setExistingUtilities] = useState<UtilityBill[]>([])
  const [propertyBills, setPropertyBills] = useState<MonthlyBill[]>([])
  const [showUtilityForm, setShowUtilityForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [templates, setTemplates] = useState<UtilityTemplate[]>([])
  const [utilityForm, setUtilityForm] = useState({
    type: 'electric' as UtilityType,
    total_amount: '',
    split_method: 'sub_meter' as SplitMethod,
    readings: {} as Record<string, string>,
    fixed_amount: '',
  })

  // Load properties once
  useEffect(() => {
    if (!profile) return
    loadProperties()
  }, [profile])

  // Load bills when month changes (bills tab)
  useEffect(() => {
    if (!profile) return
    loadBills()
  }, [profile, month])

  // Load property-specific data when property/month changes (generate tab)
  useEffect(() => {
    if (selectedProperty) {
      loadRooms()
      loadPropertyBills()
      loadUtilities()
      loadTemplates()
    }
  }, [selectedProperty, month])

  async function loadProperties() {
    const { data } = await supabase
      .from('properties').select('*').eq('landlord_id', profile!.id).eq('is_active', true)
    setProperties(data || [])
    if (data?.length) setSelectedProperty(data[0].id)
    setLoading(false)
  }

  async function loadBills() {
    const { data } = await supabase
      .from('monthly_bills')
      .select('*, room:rooms(*, property:properties(*)), tenant:profiles!monthly_bills_tenant_id_fkey(*)')
      .eq('month', month)
      .order('status')
    const myBills = (data || []).filter((b: BillWithDetails) => b.room?.property?.landlord_id === profile!.id)
    setBills(myBills)
  }

  async function loadRooms() {
    const { data } = await supabase
      .from('rooms').select('*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*))')
      .eq('property_id', selectedProperty).eq('is_active', true).order('label')
    setRooms(data || [])
  }

  async function loadPropertyBills() {
    const { data } = await supabase
      .from('monthly_bills').select('*').eq('property_id', selectedProperty).eq('month', month)
    setPropertyBills(data || [])
  }

  async function loadUtilities() {
    const { data } = await supabase
      .from('utility_bills').select('*').eq('property_id', selectedProperty).eq('month', month)
    setExistingUtilities(data || [])
  }

  async function loadTemplates() {
    const { data } = await supabase
      .from('utility_templates')
      .select('*')
      .eq('property_id', selectedProperty)
      .eq('is_active', true)
    setTemplates(data || [])
  }

  async function saveAsTemplate() {
    if (!selectedProperty || existingUtilities.length === 0) return
    // Delete old templates for this property
    await supabase.from('utility_templates').update({ is_active: false }).eq('property_id', selectedProperty)
    // Save current utilities as templates
    for (const ub of existingUtilities) {
      await supabase.from('utility_templates').insert({
        property_id: selectedProperty,
        type: ub.type,
        split_method: ub.split_method,
        default_amount: ub.total_amount,
        fixed_amount_per_room: ub.fixed_amount_per_room || null,
        is_active: true,
      })
    }
    toast.success('Template disimpan!')
    loadTemplates()
  }

  async function loadFromTemplates() {
    if (templates.length === 0) return
    for (const tmpl of templates) {
      // Check if utility already exists for this month
      const exists = existingUtilities.find(u => u.type === tmpl.type)
      if (exists) continue
      await supabase.from('utility_bills').insert({
        property_id: selectedProperty,
        month,
        type: tmpl.type,
        total_amount: tmpl.default_amount || 0,
        split_method: tmpl.split_method,
        fixed_amount_per_room: tmpl.fixed_amount_per_room || undefined,
      })
    }
    toast.success('Template dimuatkan!')
    loadUtilities()
  }

  // === Payment functions ===
  async function handleRecordPayment() {
    if (!paymentModal) return
    const { bill, amount, method } = paymentModal
    const payAmount = Number(amount)
    if (payAmount <= 0) { toast.error('Sila masukkan jumlah yang sah.'); return }

    const { error } = await supabase.from('payments').insert({
      bill_id: bill.id, amount: payAmount, date: new Date().toISOString().split('T')[0], method, receipt_sent: false,
    })
    if (error) { toast.error('Gagal merekod bayaran.'); return }

    const newTotalPaid = bill.total_paid + payAmount
    await supabase.from('monthly_bills').update({
      total_paid: newTotalPaid, status: newTotalPaid >= bill.total_due ? 'paid' : 'partial',
    }).eq('id', bill.id)

    toast.success('Bayaran direkod!')
    setPaymentModal(null)
    loadBills()
  }

  function handleWhatsApp(bill: BillWithDetails, type: 'bill' | 'reminder' | 'receipt') {
    const phone = bill.tenant.phone.replace(/[^0-9]/g, '').replace(/^0/, '60')
    let message = ''
    if (type === 'bill') message = generateBillMessage(bill, bill.tenant.name)
    else if (type === 'reminder') message = generateReminderMessage(bill, bill.tenant.name)
    else message = generateReceiptMessage(bill, bill.tenant.name)
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  // === Utility & generation functions ===
  async function handleSaveUtility(e: React.FormEvent) {
    e.preventDefault()
    const readings = utilityForm.split_method === 'sub_meter'
      ? Object.entries(utilityForm.readings).map(([room_id, reading]) => ({ room_id, reading: Number(reading) }))
      : undefined

    const { error } = await supabase.from('utility_bills').insert({
      property_id: selectedProperty, month, type: utilityForm.type,
      total_amount: Number(utilityForm.total_amount), split_method: utilityForm.split_method,
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
      const existing = propertyBills.find((b) => b.room_id === room.id && b.tenant_id === activeTenancy.tenant_id)
      if (existing) continue

      await supabase.from('monthly_bills').insert({
        tenant_id: activeTenancy.tenant_id, room_id: room.id, property_id: selectedProperty,
        month, rent_amount: rentAmount, utility_breakdown: utilityBreakdown,
        total_due: totalDue, total_paid: 0, status: 'pending',
      })
    }

    setGenerating(false)
    toast.success('Bil bulanan berjaya dijana!')
    loadPropertyBills()
    loadBills()
    setTab('bills') // Switch to bills tab to show results
  }

  if (loading) return <SkeletonList count={3} />

  // Bills tab calculations
  const totalExpected = bills.reduce((s, b) => s + b.total_due, 0)
  const totalCollected = bills.reduce((s, b) => s + b.total_paid, 0)
  const collectionPercent = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  const filteredBills = statusFilter === 'all' ? bills : bills.filter(b => {
    if (statusFilter === 'overdue') return b.status === 'overdue'
    if (statusFilter === 'pending') return b.status === 'pending' || b.status === 'partial'
    return b.status === 'paid'
  })

  const grouped = filteredBills.reduce<Record<string, { property: Property; bills: BillWithDetails[] }>>((acc, bill) => {
    const propId = bill.room?.property?.id
    if (!propId) return acc
    if (!acc[propId]) acc[propId] = { property: bill.room.property, bills: [] }
    acc[propId].bills.push(bill)
    return acc
  }, {})

  const unpaidBills = bills.filter(b => b.status !== 'paid')
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied')

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'overdue', label: 'Tertunggak' },
    { value: 'pending', label: 'Belum Bayar' },
    { value: 'paid', label: 'Selesai' },
  ]

  return (
    <div className="space-y-4 animate-in">
      {/* Tab switcher — pill style */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1.5">
        <button
          onClick={() => setTab('bills')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            tab === 'bills' ? 'bg-white text-primary-700 shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Bil Bulanan
        </button>
        <button
          onClick={() => setTab('generate')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            tab === 'generate' ? 'bg-white text-primary-700 shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Utiliti & Jana
        </button>
      </div>

      {/* ===== TAB 1: Bil Bulanan ===== */}
      {tab === 'bills' && (
        <>
          {/* Summary strip — hero style */}
          <Card variant="hero" padding="p-4" className="relative overflow-hidden">
            <div className="relative z-10">
              {/* Progress bar at top */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/70 font-medium">Collection Rate</span>
                <span className="text-sm font-bold text-white">{collectionPercent}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${collectionPercent}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-white/60 uppercase tracking-wide">Expected</p>
                  <p className="text-sm font-bold text-white">RM{totalExpected.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-white/60 uppercase tracking-wide">Collected</p>
                  <p className="text-sm font-bold text-green-300">RM{totalCollected.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-white/60 uppercase tracking-wide">Outstanding</p>
                  <p className="text-sm font-bold text-amber-300">RM{(totalExpected - totalCollected).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Month + Filters */}
          <div className="space-y-3">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3.5 h-9 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 ${
                    statusFilter === opt.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 shadow-card hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bills grouped by property */}
          {filteredBills.length === 0 ? (
            <div className="space-y-3">
              <EmptyState icon={CreditCard} title="Tiada bil untuk bulan ini" />
              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={() => setTab('generate')}>
                  Jana bil baru →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.values(grouped).map(({ property, bills: propBills }) => (
                <div key={property.id}>
                  <SectionHeader title={property.name} action={{ label: `${propBills.length} bil`, to: `/properties/${property.id}` }} />
                  <Card variant="elevated" padding="p-0">
                    <div className="divide-y divide-gray-100">
                      {propBills.map((bill) => {
                        const isExpanded = expandedBill === bill.id
                        return (
                          <div key={bill.id}>
                            <button
                              onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{bill.tenant?.name}</p>
                                <p className="text-xs text-gray-500">{bill.room?.label}</p>
                              </div>
                              <p className="font-bold text-gray-900 text-sm shrink-0">RM{bill.total_due}</p>
                              <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                              {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-3 flex gap-2">
                                {bill.status !== 'paid' && (
                                  <Button size="sm" icon={Check}
                                    onClick={() => setPaymentModal({ bill, amount: String(bill.total_due - bill.total_paid), method: 'bank_transfer' })}>
                                    Rekod Bayaran
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" icon={MessageCircle} className="!text-green-600"
                                  onClick={() => handleWhatsApp(bill, bill.status === 'paid' ? 'receipt' : bill.status === 'overdue' ? 'reminder' : 'bill')}>
                                  {bill.status === 'paid' ? 'Resit' : bill.status === 'overdue' ? 'Peringatan' : 'Hantar Bil'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Floating WhatsApp CTA */}
          {unpaidBills.length > 0 && (
            <button
              onClick={() => unpaidBills.forEach(bill => handleWhatsApp(bill, bill.status === 'overdue' ? 'reminder' : 'bill'))}
              className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 bg-green-600 text-white px-5 py-3.5 rounded-full shadow-xl hover:bg-green-700 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-semibold z-40 animate-in"
              style={{ animationDelay: '300ms' }}
            >
              <MessageCircle size={18} />
              Hantar Semua Bil
            </button>
          )}
        </>
      )}

      {/* ===== TAB 2: Utiliti & Jana Bil ===== */}
      {tab === 'generate' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="flex-1">
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="sm:!w-auto" />
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

            {/* Template buttons */}
            {existingUtilities.length === 0 && templates.length > 0 && (
              <div className="mb-4">
                <button onClick={loadFromTemplates}
                  className="w-full py-3 bg-primary-50 text-primary-600 text-sm font-medium rounded-xl hover:bg-primary-100 transition-colors">
                  Muat template bulan lepas ({templates.length} utiliti)
                </button>
              </div>
            )}

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
                {/* Save as template */}
                <button onClick={saveAsTemplate}
                  className="w-full py-2 text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Simpan sebagai template →
                </button>
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
                        <Input type="number" placeholder="kWh" value={utilityForm.readings[room.id] || ''}
                          onChange={(e) => setUtilityForm({ ...utilityForm, readings: { ...utilityForm.readings, [room.id]: e.target.value } })} />
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

          {/* Generate bills */}
          <Card variant="elevated" padding="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">Jana Bil ({month})</h2>
              <Button size="sm" icon={Receipt} loading={generating} onClick={handleGenerateBills}>
                Jana Bil
              </Button>
            </div>

            {propertyBills.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Tiada bil lagi. Masukkan bil utiliti dahulu, kemudian tekan "Jana Bil".</p>
            ) : (
              <div className="space-y-2">
                {propertyBills.map((bill) => {
                  const room = rooms.find((r) => r.id === bill.room_id)
                  const tenant = room?.tenancies?.find((t) => t.status === 'active')?.tenant
                  return (
                    <div key={bill.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{tenant?.name || 'Penyewa'}</div>
                        <div className="text-xs text-gray-500">{room?.label} — RM{bill.rent_amount}</div>
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
        </>
      )}

      {/* Payment bottom sheet */}
      <BottomSheet open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Rekod Bayaran">
        {paymentModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{paymentModal.bill.tenant?.name} — RM{paymentModal.bill.total_due}</p>
            <Input label="Jumlah (RM)" type="number" value={paymentModal.amount}
              onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })} />
            <Select label="Kaedah bayaran" value={paymentModal.method}
              onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value as PaymentMethod })}>
              <option value="bank_transfer">Pindahan bank</option>
              <option value="duitnow">DuitNow</option>
              <option value="cash">Tunai</option>
              <option value="other">Lain-lain</option>
            </Select>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPaymentModal(null)}>Batal</Button>
              <Button className="flex-1" onClick={handleRecordPayment}>Simpan</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
