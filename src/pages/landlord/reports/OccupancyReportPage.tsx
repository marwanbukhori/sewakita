import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download, FileDown } from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Property, Room } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { SkeletonList } from '@/components/ui/Skeleton'
import { downloadCSV } from '@/lib/csv'
import { CHART_COLORS, CHART_FONT, getLast12Months, formatMonthShort } from '@/lib/chart-theme'
import { createReportPDF, addChartToPage, addStatCard, addTableRows, saveReport, captureChart } from '@/lib/report-pdf'

interface RoomWithProperty extends Room {
  property: Property
}

interface VacantRoom {
  property: string
  room: string
  daysVacant: number
}

export default function OccupancyReportPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomWithProperty[]>([])
  const [trendData, setTrendData] = useState<{ month: string; label: string; rate: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    const { data: roomData } = await supabase
      .from('rooms')
      .select('*, property:properties!inner(name, id, landlord_id)')
      .eq('properties.landlord_id', profile!.id)
      .eq('is_active', true)

    setRooms((roomData || []) as RoomWithProperty[])

    // Compute occupancy trend from monthly_bills
    const months = getLast12Months()
    const { data: bills } = await supabase
      .from('monthly_bills')
      .select('month, room_id')
      .in('month', months)

    const totalRoomCount = (roomData || []).length
    const trend = months.map(m => {
      const uniqueRooms = new Set((bills || []).filter(b => b.month === m).map(b => b.room_id))
      const rate = totalRoomCount > 0 ? Math.round((uniqueRooms.size / totalRoomCount) * 100) : 0
      return { month: m, label: formatMonthShort(m), rate }
    })
    setTrendData(trend)
    setLoading(false)
  }

  const total = rooms.length
  const occupied = rooms.filter(r => r.status === 'occupied').length
  const vacant = total - occupied
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0

  // Per-property occupancy for donut
  const byProperty = rooms.reduce<Record<string, { name: string; occupied: number; total: number }>>((acc, r) => {
    const id = r.property.id
    if (!acc[id]) acc[id] = { name: r.property.name, occupied: 0, total: 0 }
    acc[id].total++
    if (r.status === 'occupied') acc[id].occupied++
    return acc
  }, {})

  const vacantRooms: VacantRoom[] = rooms
    .filter(r => r.status === 'vacant')
    .map(r => ({ property: r.property.name, room: r.label, daysVacant: 0 }))

  function handleExportCSV() {
    downloadCSV('sewakita-penghunian.csv',
      ['Hartanah', 'Bilik', 'Status'],
      rooms.map(r => [r.property.name, r.label, r.status === 'occupied' ? 'Dihuni' : 'Kosong'])
    )
  }

  async function handleExportPDF() {
    const doc = createReportPDF('Laporan Penghunian', new Date().toLocaleDateString('ms-MY'))
    let y = 50
    addStatCard(doc, 'Penghunian', `${occupancyRate}%`, 20, y)
    addStatCard(doc, 'Dihuni', `${occupied}`, 65, y)
    addStatCard(doc, 'Kosong', `${vacant}`, 110, y)
    y += 28
    try {
      const img = await captureChart('chart-occupancy-trend')
      y = addChartToPage(doc, img, y, 60)
    } catch { /* */ }
    y = addTableRows(doc,
      ['Hartanah', 'Bilik', 'Status'],
      rooms.map(r => [r.property.name, r.label, r.status === 'occupied' ? 'Dihuni' : 'Kosong']),
      y
    )
    saveReport(doc, 'Penghunian', new Date().toISOString().slice(0, 7))
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>Kembali</Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Kadar Penghunian</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>CSV</Button>
          <Button variant="ghost" size="sm" icon={FileDown} onClick={handleExportPDF}>PDF</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">Kadar</p>
          <p className="text-lg font-bold text-primary-600">{occupancyRate}%</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">Dihuni</p>
          <p className="text-lg font-bold text-gray-900">{occupied}</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">Kosong</p>
          <p className="text-lg font-bold text-amber-600">{vacant}</p>
        </Card>
      </div>

      {/* Trend line */}
      <Card variant="elevated" padding="p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">Trend Penghunian (12 bulan)</p>
        <div id="chart-occupancy-trend">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" width={35} />
              <Tooltip formatter={(v) => `${v}%`} labelStyle={CHART_FONT} />
              <Line type="monotone" dataKey="rate" name="Penghunian" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Per-property donut */}
      <Card variant="elevated" padding="p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">Per Hartanah</p>
        <div id="chart-occupancy-by-property" className="flex items-center justify-center gap-4">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={[{ name: 'Dihuni', value: occupied }, { name: 'Kosong', value: vacant }]}
                cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                <Cell fill={CHART_COLORS.primary} />
                <Cell fill={CHART_COLORS.neutral} />
              </Pie>
              <Tooltip formatter={(v) => `${v} bilik`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {Object.values(byProperty).map(p => (
              <div key={p.name} className="text-sm">
                <p className="font-medium text-gray-800">{p.name}</p>
                <p className="text-[11px] text-gray-500">{p.occupied}/{p.total} dihuni</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Vacancy list */}
      {vacantRooms.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2">Bilik Kosong</p>
          <Card variant="elevated" padding="p-0">
            <div className="divide-y divide-gray-100">
              {vacantRooms.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.room}</p>
                    <p className="text-[11px] text-gray-500">{r.property}</p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Kosong</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
