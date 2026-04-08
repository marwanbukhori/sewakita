import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download, FileDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import type { MonthlyBill, Property } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { SkeletonList } from '@/components/ui/Skeleton'
import ProGate from '@/components/ui/ProGate'
import { downloadCSV } from '@/lib/csv'
import { CHART_COLORS, CHART_FONT, formatRM, formatMonthShort } from '@/lib/chart-theme'
import { createReportPDF, addChartToPage, addStatCard, addTableRows, saveReport, captureChart } from '@/lib/report-pdf'

interface PropertyIncome {
  propertyName: string
  totalIncome: number
  months: Record<string, number>
}

export default function AnnualReportPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [data, setData] = useState<PropertyIncome[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile, year])

  async function loadData() {
    setLoading(true)

    // Get all bills for this year
    const { data: bills } = await supabase
      .from('monthly_bills')
      .select('*, room:rooms(property:properties(name, id, landlord_id))')
      .gte('month', `${year}-01`)
      .lte('month', `${year}-12`)

    const myBills = (bills || []).filter((b: MonthlyBill & { room: { property: Property & { landlord_id: string } } }) =>
      b.room?.property?.landlord_id === profile!.id
    )

    // Group by property
    const propertyMap: Record<string, PropertyIncome> = {}
    for (const bill of myBills) {
      const propName = (bill as { room: { property: { name: string; id: string } } }).room?.property?.name || 'Lain-lain'
      const propId = (bill as { room: { property: { id: string } } }).room?.property?.id || 'unknown'
      if (!propertyMap[propId]) {
        propertyMap[propId] = { propertyName: propName, totalIncome: 0, months: {} }
      }
      propertyMap[propId].totalIncome += bill.total_paid
      propertyMap[propId].months[bill.month] = (propertyMap[propId].months[bill.month] || 0) + bill.total_paid
    }

    setData(Object.values(propertyMap))
    setLoading(false)
  }

  function handleExport() {
    const headers = ['Hartanah', 'Bulan', 'Pendapatan Sewa (RM)']
    const rows: string[][] = []
    for (const prop of data) {
      const sortedMonths = Object.keys(prop.months).sort()
      for (const m of sortedMonths) {
        rows.push([prop.propertyName, m, String(prop.months[m])])
      }
      rows.push([prop.propertyName, `JUMLAH ${year}`, String(prop.totalIncome)])
    }
    const grandTotal = data.reduce((s, p) => s + p.totalIncome, 0)
    rows.push(['JUMLAH KESELURUHAN', year, String(grandTotal)])
    downloadCSV(`rerumah-cukai-${year}.csv`, headers, rows)
  }

  const grandTotal = data.reduce((s, p) => s + p.totalIncome, 0)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Build stacked chart data: 12 months, each with per-property income
  const stackedChartData = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`
    const row: Record<string, string | number> = { month: formatMonthShort(m) }
    for (const prop of data) {
      row[prop.propertyName] = prop.months[m] || 0
    }
    return row
  })

  const STACK_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.accent, CHART_COLORS.warning, CHART_COLORS.danger]

  async function handleExportPDF() {
    const doc = createReportPDF('Ringkasan Cukai Tahunan', `Tahun ${year}`)
    let y = 50
    addStatCard(doc, 'Pendapatan', formatRM(grandTotal), 20, y)
    addStatCard(doc, 'Hartanah', `${data.length}`, 65, y)
    y += 28
    try {
      const img = await captureChart('chart-annual-income')
      y = addChartToPage(doc, img, y, 70)
    } catch { /* */ }
    y = addTableRows(doc,
      ['Hartanah', 'Bulan', 'Pendapatan (RM)'],
      data.flatMap(p => Object.entries(p.months).sort(([a], [b]) => a.localeCompare(b)).map(([m, amt]) => [p.propertyName, m, String(amt)])),
      y
    )
    // LHDN note
    if (y > 250) { doc.addPage(); y = 20 }
    y += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Nota LHDN: Pendapatan sewa diisytiharkan di bawah Seksyen 4(d) Akta Cukai Pendapatan 1967.', 20, y)
    y += 4
    doc.text('Simpan rekod selama 7 tahun.', 20, y)
    saveReport(doc, 'Cukai', year)
  }

  if (loading) return <SkeletonList count={2} />

  return (
    <ProGate feature="reports">
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Ringkasan Cukai</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>CSV</Button>
          <Button variant="ghost" size="sm" icon={FileDown} onClick={handleExportPDF}>PDF</Button>
        </div>
      </div>

      <Select value={year} onChange={(e) => setYear(e.target.value)}>
        {yearOptions.map(y => <option key={y} value={y}>Tahun {y}</option>)}
      </Select>

      {/* Grand total */}
      <Card variant="hero" padding="p-5">
        <p className="text-white/60 text-sm mb-1">Jumlah Pendapatan Sewa {year}</p>
        <p className="text-3xl font-bold">RM{grandTotal.toLocaleString()}</p>
        <p className="text-white/60 text-xs mt-2">
          * Perbelanjaan belum direkod. Sila simpan resit untuk potongan cukai LHDN.
        </p>
      </Card>

      {/* Stacked income chart */}
      {data.length > 0 && (
        <Card variant="elevated" padding="p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Pendapatan Bulanan per Hartanah</p>
          <div id="chart-annual-income">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stackedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatRM(Number(v))} labelStyle={CHART_FONT} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.map((prop, i) => (
                  <Bar key={prop.propertyName} dataKey={prop.propertyName} stackId="income" fill={STACK_COLORS[i % STACK_COLORS.length]} radius={i === data.length - 1 ? [3, 3, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Per property */}
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Tiada data untuk tahun ini.</p>
      ) : (
        <div className="space-y-4">
          {data.map((prop) => (
            <Card key={prop.propertyName} variant="elevated" padding="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{prop.propertyName}</h3>
              <div className="space-y-1.5">
                {Object.entries(prop.months).sort(([a], [b]) => a.localeCompare(b)).map(([m, amount]) => {
                  const monthLabel = new Date(m + '-01').toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' })
                  return (
                    <div key={m} className="flex justify-between text-sm">
                      <span className="text-gray-500">{monthLabel}</span>
                      <span className="font-medium text-gray-800">RM{amount.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-100">
                <span className="text-gray-800">Jumlah</span>
                <span className="text-primary-600">RM{prop.totalIncome.toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card variant="outlined" padding="p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>Nota LHDN:</strong> Pendapatan sewa diisytiharkan di bawah Seksyen 4(d) Akta Cukai Pendapatan 1967.
          Perbelanjaan yang boleh ditolak termasuk: cukai taksiran, cukai tanah, faedah pinjaman, insurans, penyelenggaraan, dan bayaran ejen.
          Simpan rekod selama 7 tahun.
        </p>
      </Card>
    </div>
    </ProGate>
  )
}
