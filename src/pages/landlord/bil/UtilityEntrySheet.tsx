import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronUp, Plus, Zap, Droplets, Wifi, Receipt } from 'lucide-react'
import type { Property, Room, Tenancy, Profile, MonthlyBill, UtilityBill, UtilityTemplate, UtilityType, SplitMethod } from '@/types/database'
import toast from 'react-hot-toast'
import BottomSheet from '@/components/ui/BottomSheet'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import StatusBadge from '@/components/ui/StatusBadge'
import SplitMethodPicker from '@/components/billing/SplitMethodPicker'
import ScanBillCTA from '@/components/billing/ScanBillCTA'
import ScanResultSheet from '@/components/billing/ScanResultSheet'
import UtilityHistoryStrip from '@/components/billing/UtilityHistoryStrip'
import { getSuggestedAmount, getLastNMonthsUtilities } from '@/lib/utilities'
import type { ExtractionResult } from '../../../../supabase/functions/_shared/ocr-prompts'
import { hasOCR, getPlanTier } from '@/lib/feature-gates'
import { getCurrentPlanCode } from '@/lib/subscription'
import { useAuth } from '@/lib/auth-context'

const UTILITY_ICONS: Record<string, typeof Zap> = { electric: Zap, water: Droplets, internet: Wifi }
const UTILITY_LABELS: Record<string, string> = { electric: 'Elektrik (TNB)', water: 'Air (SYABAS)', internet: 'Internet' }

type RoomWithTenancies = Room & { tenancies: (Tenancy & { tenant: Profile })[] }

interface UtilityEntrySheetProps {
  open: boolean
  onClose: () => void
  properties: Property[]
  selectedProperty: string
  onPropertyChange: (id: string) => void
  month: string
  onBillsGenerated: () => void
}

export default function UtilityEntrySheet({
  open,
  onClose,
  properties,
  selectedProperty,
  onPropertyChange,
  month,
  onBillsGenerated,
}: UtilityEntrySheetProps) {
  const { profile } = useAuth()
  const [planTier, setPlanTier] = useState<'free' | 'pro'>('free')
  const [rooms, setRooms] = useState<RoomWithTenancies[]>([])
  const [existingUtilities, setExistingUtilities] = useState<UtilityBill[]>([])
  const [propertyBills, setPropertyBills] = useState<MonthlyBill[]>([])
  const [templates, setTemplates] = useState<UtilityTemplate[]>([])
  const [showUtilityForm, setShowUtilityForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [preFilled, setPreFilled] = useState(false)
  const [scanResult, setScanResult] = useState<ExtractionResult | null>(null)
  const [showScanResult, setShowScanResult] = useState(false)
  const [scanHistoryAmounts, setScanHistoryAmounts] = useState<number[]>([])
  const [utilityForm, setUtilityForm] = useState({
    type: 'electric' as UtilityType,
    total_amount: '',
    split_method: 'sub_meter' as SplitMethod,
    readings: {} as Record<string, string>,
    fixed_amount: '',
  })

  useEffect(() => {
    if (open && selectedProperty) {
      loadRooms()
      loadUtilities()
      loadPropertyBills()
      loadTemplates()
    }
  }, [open, selectedProperty, month])

  useEffect(() => {
    if (profile) getCurrentPlanCode(profile.id).then(code => setPlanTier(getPlanTier(code)))
  }, [profile])

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
      .from('utility_templates').select('*').eq('property_id', selectedProperty).eq('is_active', true)
    setTemplates(data || [])
  }

  async function saveAsTemplate() {
    if (!selectedProperty || existingUtilities.length === 0) return
    await supabase.from('utility_templates').update({ is_active: false }).eq('property_id', selectedProperty)
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
    onBillsGenerated()
  }

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied')

  async function prefillAmount(type: UtilityType) {
    const history = await getLastNMonthsUtilities(selectedProperty, type, 3, month)
    const suggested = getSuggestedAmount(history)
    if (suggested !== null) {
      setUtilityForm(prev => ({ ...prev, total_amount: String(suggested) }))
      setPreFilled(true)
    }
  }

  async function openUtilityForm() {
    if (showUtilityForm) {
      setShowUtilityForm(false)
      return
    }
    setShowUtilityForm(true)
    prefillAmount(utilityForm.type)
  }

  async function handleScanFile(file: File) {
    setScanning(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${selectedProperty}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('utility-scans')
        .upload(path, file, { contentType: file.type })
      if (uploadErr) throw new Error(uploadErr.message)

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-utility-bill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: path, utility_type_hint: utilityForm.type }),
        }
      )
      const data = await response.json()

      if (data.success && data.extraction) {
        setScanResult(data.extraction)
        const history = await getLastNMonthsUtilities(selectedProperty, data.extraction.utility_type, 3, month)
        setScanHistoryAmounts(history.map(h => h.total_amount))
        setShowScanResult(true)
      } else {
        toast.error(data.error || 'Gagal membaca bil')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload gagal')
    }
    setScanning(false)
  }

  function handleScanAccept(extraction: ExtractionResult) {
    setShowScanResult(false)
    setUtilityForm(prev => ({
      ...prev,
      type: extraction.utility_type,
      total_amount: String(extraction.total_amount),
    }))
    setPreFilled(true)
    setShowUtilityForm(true)

    supabase.from('utility_bills').insert({
      property_id: selectedProperty, month,
      type: extraction.utility_type,
      total_amount: extraction.total_amount,
      split_method: utilityForm.split_method,
      source: 'scanned',
      scan_confidence: extraction.confidence,
    }).then(({ error }) => {
      if (error) { toast.error('Gagal menyimpan.'); return }
      toast.success('Bil utiliti disimpan!')
      loadUtilities()
      setShowUtilityForm(false)
    })
  }

  function handleScanEdit(extraction: ExtractionResult) {
    setShowScanResult(false)
    setUtilityForm(prev => ({
      ...prev,
      type: extraction.utility_type,
      total_amount: String(extraction.total_amount),
    }))
    setPreFilled(false)
    setShowUtilityForm(true)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Utiliti & Jana Bil">
      <div className="space-y-4">
        {/* Property selector */}
        <Select value={selectedProperty} onChange={(e) => onPropertyChange(e.target.value)}>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>

        {/* Scan CTA — Pro only */}
        {hasOCR(planTier) && (
          <>
            <ScanBillCTA
              loading={scanning}
              onFileSelected={handleScanFile}
            />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">atau key-in manual</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </>
        )}

        {/* Utility bills */}
        <Card variant="elevated" padding="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Bil Utiliti</h2>
            <Button variant="ghost" size="sm" onClick={() => openUtilityForm()}
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
              <button onClick={saveAsTemplate}
                className="w-full py-2 text-xs text-primary-600 hover:text-primary-700 font-medium">
                Simpan sebagai template →
              </button>
            </div>
          )}

          {showUtilityForm && (
            <form onSubmit={handleSaveUtility} className="space-y-3 bg-primary-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <Select value={utilityForm.type} onChange={(e) => {
                  const type = e.target.value as UtilityType
                  setUtilityForm({ ...utilityForm, type })
                  prefillAmount(type)
                }}>
                  <option value="electric">Elektrik (TNB)</option>
                  <option value="water">Air (SYABAS)</option>
                  <option value="internet">Internet</option>
                </Select>
                <div className="relative">
                  <Input type="number" required placeholder="Jumlah (RM)" value={utilityForm.total_amount}
                    onChange={(e) => { setUtilityForm({ ...utilityForm, total_amount: e.target.value }); setPreFilled(false) }} />
                  {preFilled && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-semibold">
                      Pre-filled
                    </span>
                  )}
                </div>
              </div>

              {/* History strip */}
              <UtilityHistoryStrip
                propertyId={selectedProperty}
                utilityType={utilityForm.type}
                currentMonth={month}
              />
              <SplitMethodPicker
                value={utilityForm.split_method}
                onChange={(method) => setUtilityForm({ ...utilityForm, split_method: method })}
                totalAmount={Number(utilityForm.total_amount) || 0}
                occupiedRoomCount={occupiedRooms.length}
              />

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

              <Button type="submit" fullWidth>
                {preFilled ? '✓ Looks right — save' : 'Simpan Bil Utiliti'}
              </Button>
            </form>
          )}
        </Card>

        {/* Generate bills section */}
        <Card variant="elevated" padding="p-4">
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
      </div>

      {/* Scan result sheet */}
      <ScanResultSheet
        open={showScanResult}
        onClose={() => setShowScanResult(false)}
        extraction={scanResult}
        historyAmounts={scanHistoryAmounts}
        onAccept={handleScanAccept}
        onRescan={() => { setShowScanResult(false); setScanResult(null) }}
        onEdit={handleScanEdit}
      />
    </BottomSheet>
  )
}
