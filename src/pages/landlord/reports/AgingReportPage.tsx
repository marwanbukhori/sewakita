import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download, FileDown, MessageCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import type { MonthlyBill, Property, Room, Profile } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { SkeletonList } from '@/components/ui/Skeleton'
import { downloadCSV } from '@/lib/csv'
import { CHART_COLORS, CHART_FONT, formatRM } from '@/lib/chart-theme'
import { createReportPDF, addChartToPage, addStatCard, addTableRows, saveReport, captureChart } from '@/lib/report-pdf'

interface OverdueBill extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
  daysOverdue: number
}

interface AgingBucket {
  label: string
  range: string
  amount: number
  count: number
  color: string
}

export default function AgingReportPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [bills, setBills] = useState<OverdueBill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    const { data } = await supabase
      .from('monthly_bills')
      .select('*, room:rooms(label, property:properties(name, id, landlord_id)), tenant:profiles!monthly_bills_tenant_id_fkey(name, phone)')
      .in('status', ['overdue', 'pending', 'partial'])

    const now = new Date()
    const myBills = (data || [])
      .filter((b: OverdueBill) => (b.room?.property as Property & { landlord_id: string })?.landlord_id === profile!.id)
      .map((b: OverdueBill) => {
        const billDate = new Date(b.month + '-01')
        const daysOverdue = Math.max(0, Math.floor((now.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24)))
        return { ...b, daysOverdue }
      })
      .sort((a: OverdueBill, b: OverdueBill) => b.daysOverdue - a.daysOverdue)

    setBills(myBills)
    setLoading(false)
  }

  const totalArrears = bills.reduce((s, b) => s + (b.total_due - b.total_paid), 0)
  const tenantCount = new Set(bills.map(b => b.tenant_id)).size
  const avgDays = bills.length > 0 ? Math.round(bills.reduce((s, b) => s + b.daysOverdue, 0) / bills.length) : 0

  const buckets: AgingBucket[] = [
    { label: '1-30', range: '1-30 hari', amount: 0, count: 0, color: CHART_COLORS.warning },
    { label: '31-60', range: '31-60 hari', amount: 0, count: 0, color: '#f97316' },
    { label: '61-90', range: '61-90 hari', amount: 0, count: 0, color: CHART_COLORS.danger },
    { label: '90+', range: '90+ hari', amount: 0, count: 0, color: '#991b1b' },
  ]

  for (const b of bills) {
    const outstanding = b.total_due - b.total_paid
    if (b.daysOverdue <= 30) { buckets[0].amount += outstanding; buckets[0].count++ }
    else if (b.daysOverdue <= 60) { buckets[1].amount += outstanding; buckets[1].count++ }
    else if (b.daysOverdue <= 90) { buckets[2].amount += outstanding; buckets[2].count++ }
    else { buckets[3].amount += outstanding; buckets[3].count++ }
  }

  function handleExportCSV() {
    downloadCSV('sewakita-tunggakan.csv',
      ['Penyewa', 'Hartanah', 'Bilik', 'Bulan', 'Tertunggak (RM)', 'Hari Lewat'],
      bills.map(b => [b.tenant?.name || '', b.room?.property?.name || '', b.room?.label || '', b.month, String(b.total_due - b.total_paid), String(b.daysOverdue)])
    )
  }

  async function handleExportPDF() {
    const doc = createReportPDF('Laporan Tunggakan', new Date().toLocaleDateString('ms-MY'))
    let y = 50
    addStatCard(doc, 'Tunggakan', formatRM(totalArrears), 20, y)
    addStatCard(doc, 'Penyewa', `${tenantCount}`, 65, y)
    addStatCard(doc, 'Purata hari', `${avgDays}`, 110, y)
    y += 28
    try {
      const img = await captureChart('chart-aging')
      y = addChartToPage(doc, img, y, 70)
    } catch { /* */ }
    y = addTableRows(doc,
      ['Penyewa', 'Hartanah', 'Bilik', 'Bulan', 'RM', 'Hari'],
      bills.map(b => [b.tenant?.name || '', b.room?.property?.name || '', b.room?.label || '', b.month, String(b.total_due - b.total_paid), String(b.daysOverdue)]),
      y
    )
    saveReport(doc, 'Tunggakan', new Date().toISOString().slice(0, 7))
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>Kembali</Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Tunggakan Penyewa</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>CSV</Button>
          <Button variant="ghost" size="sm" icon={FileDown} onClick={handleExportPDF}>PDF</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">Jumlah tunggakan</p>
          <p className="text-lg font-bold text-red-600">{formatRM(totalArrears)}</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">Penyewa</p>
          <p className="text-lg font-bold text-gray-900">{tenantCount}</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">Purata hari</p>
          <p className="text-lg font-bold text-gray-900">{avgDays}</p>
        </Card>
      </div>

      {/* Aging buckets chart */}
      {bills.length > 0 && (
        <Card variant="elevated" padding="p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Agihan Tunggakan</p>
          <div id="chart-aging">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} width={45} tickFormatter={v => formatRM(v)} />
                <Tooltip formatter={(v) => formatRM(Number(v))} labelStyle={CHART_FONT} />
                <Bar dataKey="amount" name="Tunggakan" radius={[4, 4, 0, 0]}>
                  {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Tenant list */}
      {bills.length === 0 ? (
        <Card variant="elevated" padding="p-6" className="text-center">
          <p className="text-sm text-gray-400">Tiada tunggakan. Semua penyewa up to date!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {bills.map(b => {
            const outstanding = b.total_due - b.total_paid
            const phone = b.tenant?.phone?.replace(/[^0-9]/g, '').replace(/^0/, '60')
            return (
              <Card key={b.id} variant="elevated" padding="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.tenant?.name}</p>
                    <p className="text-[11px] text-gray-500">{b.room?.property?.name} · {b.room?.label} · {b.month}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{formatRM(outstanding)}</p>
                      <p className="text-[10px] text-gray-400">{b.daysOverdue} hari</p>
                    </div>
                    {phone && (
                      <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                        <MessageCircle size={16} />
                      </a>
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
