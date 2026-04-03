import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download } from 'lucide-react'
import type { MonthlyBill, Property } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { SkeletonList } from '@/components/ui/Skeleton'
import { downloadCSV } from '@/lib/csv'

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
    downloadCSV(`sewakita-cukai-${year}.csv`, headers, rows)
  }

  const grandTotal = data.reduce((s, p) => s + p.totalIncome, 0)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  if (loading) return <SkeletonList count={2} />

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Ringkasan Cukai</h1>
        <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>
          CSV
        </Button>
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
  )
}
