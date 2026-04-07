import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download, FileDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { MonthlyBill, Room, Property, Profile } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import { SkeletonList } from '@/components/ui/Skeleton'
import ProGate from '@/components/ui/ProGate'
import { downloadCSV } from '@/lib/csv'
import { CHART_COLORS, CHART_FONT, formatRM } from '@/lib/chart-theme'
import { createReportPDF, addChartToPage, addStatCard, addTableRows, saveReport, captureChart } from '@/lib/report-pdf'

interface BillReport extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
}

export default function MonthlyReportPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [bills, setBills] = useState<BillReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadBills()
  }, [profile, month])

  async function loadBills() {
    setLoading(true)
    const { data } = await supabase
      .from('monthly_bills')
      .select('*, room:rooms(label, property:properties(name, id, landlord_id)), tenant:profiles!monthly_bills_tenant_id_fkey(name)')
      .eq('month', month)
      .order('status')

    const myBills = (data || []).filter((b: BillReport) => {
      const prop = b.room?.property as Property & { landlord_id?: string }
      return prop?.landlord_id === profile!.id
    })
    setBills(myBills)
    setLoading(false)
  }

  function handleExport() {
    const headers = [t('reports.property_header'), t('reports.room_header'), t('reports.tenant_header'), t('reports.expected_rm'), t('reports.collected_rm'), t('reports.status'), t('reports.month')]
    const rows = bills.map(b => [
      b.room?.property?.name || '',
      b.room?.label || '',
      b.tenant?.name || '',
      String(b.total_due),
      String(b.total_paid),
      b.status === 'paid' ? t('billing.paid_label') : b.status === 'overdue' ? t('billing.overdue_label') : b.status === 'partial' ? t('billing.partial_label') : t('billing.pending_label'),
      b.month,
    ])
    downloadCSV(`sewakita-kutipan-${month}.csv`, headers, rows)
  }

  const totalExpected = bills.reduce((s, b) => s + b.total_due, 0)
  const totalCollected = bills.reduce((s, b) => s + b.total_paid, 0)
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  // Chart data by property
  const chartData = Object.values(
    bills.reduce<Record<string, { name: string; expected: number; collected: number }>>((acc, b) => {
      const propName = b.room?.property?.name || 'Lain-lain'
      const propId = (b.room?.property as Property & { id?: string })?.id || 'unknown'
      if (!acc[propId]) acc[propId] = { name: propName, expected: 0, collected: 0 }
      acc[propId].expected += b.total_due
      acc[propId].collected += b.total_paid
      return acc
    }, {})
  )

  async function handleExportPDF() {
    const doc = createReportPDF('Laporan Kutipan Bulanan', month)
    let y = 50
    addStatCard(doc, 'Dijangka', formatRM(totalExpected), 20, y)
    addStatCard(doc, 'Dikutip', formatRM(totalCollected), 65, y)
    addStatCard(doc, 'Kadar', `${collectionRate}%`, 110, y)
    y += 28
    try {
      const img = await captureChart('chart-monthly-collection')
      y = addChartToPage(doc, img, y, 70)
    } catch { /* */ }
    y = addTableRows(doc,
      ['Hartanah', 'Bilik', 'Penyewa', 'Dijangka', 'Dikutip', 'Status'],
      bills.map(b => [b.room?.property?.name || '', b.room?.label || '', b.tenant?.name || '', String(b.total_due), String(b.total_paid), b.status]),
      y
    )
    saveReport(doc, 'Kutipan', month)
  }

  // Group by property
  const grouped = bills.reduce<Record<string, { name: string; bills: BillReport[] }>>((acc, b) => {
    const propName = b.room?.property?.name || 'Lain-lain'
    const propId = (b.room?.property as Property & { id?: string })?.id || 'unknown'
    if (!acc[propId]) acc[propId] = { name: propName, bills: [] }
    acc[propId].bills.push(b)
    return acc
  }, {})

  if (loading) return <SkeletonList count={3} />

  return (
    <ProGate feature="reports">
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('reports.monthly_title')}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>CSV</Button>
          <Button variant="ghost" size="sm" icon={FileDown} onClick={handleExportPDF}>PDF</Button>
        </div>
      </div>

      <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />

      {/* Summary */}
      <Card variant="hero" padding="p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-white/60 text-xs">{t('reports.expected')}</p>
            <p className="text-lg font-bold">RM{totalExpected.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">{t('reports.collected')}</p>
            <p className="text-lg font-bold">RM{totalCollected.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">{t('reports.rate')}</p>
            <p className="text-lg font-bold">{collectionRate}%</p>
          </div>
        </div>
        <div className="relative h-2 bg-white/20 rounded-full overflow-hidden mt-3">
          <div className="absolute inset-y-0 left-0 bg-white rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
        </div>
      </Card>

      {/* Per-property chart */}
      {chartData.length > 0 && (
        <Card variant="elevated" padding="p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Kutipan per Hartanah</p>
          <div id="chart-monthly-collection">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatRM(Number(v))} labelStyle={CHART_FONT} />
                <Bar dataKey="expected" name="Dijangka" fill={CHART_COLORS.neutral} radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" name="Dikutip" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Per-property breakdown */}
      {bills.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{t('reports.no_bills_month')}</p>
      ) : (
        <div className="space-y-5">
          {Object.values(grouped).map(({ name, bills: propBills }) => (
            <div key={name}>
              <SectionHeader title={name} />
              <Card variant="elevated" padding="p-0">
                <div className="divide-y divide-gray-100">
                  {propBills.map(bill => (
                    <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{bill.room?.label}</p>
                        <p className="text-xs text-gray-500">{bill.tenant?.name}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800 shrink-0">RM{bill.total_due}</p>
                      <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
    </ProGate>
  )
}
