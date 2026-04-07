import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download, FileText, Calendar, AlertTriangle, Users, Home, ChevronRight } from 'lucide-react'
import { CHART_COLORS, CHART_FONT, formatRM, formatMonthShort, getLast12Months } from '@/lib/chart-theme'
import { createReportPDF, addChartToPage, addStatCard, saveReport, captureChart } from '@/lib/report-pdf'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { SkeletonList } from '@/components/ui/Skeleton'
import ProGate from '@/components/ui/ProGate'
import type { Property } from '@/types/database'

interface MonthlyData {
  month: string
  label: string
  expected: number
  collected: number
  collectionRate: number
}

export default function ReportsDashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [totalRooms, setTotalRooms] = useState(0)
  const [occupiedRooms, setOccupiedRooms] = useState(0)
  const [totalArrears, setTotalArrears] = useState(0)

  useEffect(() => {
    if (!profile) return
    loadProperties()
  }, [profile])

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile, selectedProperty, properties])

  async function loadProperties() {
    const { data } = await supabase
      .from('properties').select('*').eq('landlord_id', profile!.id).eq('is_active', true)
    setProperties(data || [])
    setLoading(false)
  }

  async function loadData() {
    const months = getLast12Months()
    const propertyFilter = selectedProperty === 'all'
      ? properties.map(p => p.id)
      : [selectedProperty]

    if (propertyFilter.length === 0) return

    // Bills for last 12 months
    const { data: bills } = await supabase
      .from('monthly_bills')
      .select('month, total_due, total_paid, status, property_id')
      .in('month', months)
      .in('property_id', propertyFilter)

    const grouped = months.map(m => {
      const monthBills = (bills || []).filter(b => b.month === m)
      const expected = monthBills.reduce((s, b) => s + b.total_due, 0)
      const collected = monthBills.reduce((s, b) => s + b.total_paid, 0)
      return {
        month: m,
        label: formatMonthShort(m),
        expected,
        collected,
        collectionRate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      }
    })
    setMonthlyData(grouped)

    // Arrears
    const { data: overdueBills } = await supabase
      .from('monthly_bills')
      .select('total_due, total_paid')
      .in('property_id', propertyFilter)
      .in('status', ['overdue', 'pending', 'partial'])
    setTotalArrears((overdueBills || []).reduce((s, b) => s + (b.total_due - b.total_paid), 0))

    // Rooms
    const { data: rooms } = await supabase
      .from('rooms')
      .select('status, property_id')
      .in('property_id', propertyFilter)
      .eq('is_active', true)
    setTotalRooms((rooms || []).length)
    setOccupiedRooms((rooms || []).filter(r => r.status === 'occupied').length)
  }

  async function handleExportPDF() {
    const doc = createReportPDF('Laporan Ringkasan', new Date().toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }))
    let y = 50

    // Stat cards
    const yearIncome = monthlyData.reduce((s, d) => s + d.collected, 0)
    const avgCollection = monthlyData.filter(d => d.expected > 0).length > 0
      ? Math.round(monthlyData.filter(d => d.expected > 0).reduce((s, d) => s + d.collectionRate, 0) / monthlyData.filter(d => d.expected > 0).length)
      : 0
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    addStatCard(doc, 'Pendapatan', formatRM(yearIncome), 20, y)
    addStatCard(doc, 'Kutipan', `${avgCollection}%`, 65, y)
    addStatCard(doc, 'Penghunian', `${occupancyRate}%`, 110, y)
    addStatCard(doc, 'Tunggakan', formatRM(totalArrears), 155, y)
    y += 28

    // Charts
    try {
      const incomeChart = await captureChart('chart-monthly-income')
      y = addChartToPage(doc, incomeChart, y, 70)
    } catch { /* chart not rendered */ }

    try {
      const trendChart = await captureChart('chart-collection-trend')
      y = addChartToPage(doc, trendChart, y, 60)
    } catch { /* chart not rendered */ }

    saveReport(doc, 'Ringkasan', new Date().toISOString().slice(0, 7))
  }

  if (loading) return <SkeletonList count={3} />

  const yearIncome = monthlyData.reduce((s, d) => s + d.collected, 0)
  const avgCollection = monthlyData.filter(d => d.expected > 0).length > 0
    ? Math.round(monthlyData.filter(d => d.expected > 0).reduce((s, d) => s + d.collectionRate, 0) / monthlyData.filter(d => d.expected > 0).length)
    : 0
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  const reportLinks = [
    { to: '/reports/monthly', icon: Calendar, label: t('reports.monthly_collection'), desc: t('reports.monthly_collection_desc'), color: 'bg-blue-50 text-blue-600' },
    { to: '/reports/annual', icon: FileText, label: t('reports.annual_tax'), desc: t('reports.annual_tax_desc'), color: 'bg-purple-50 text-purple-600' },
    { to: '/reports/aging', icon: AlertTriangle, label: t('reports.tenant_aging'), desc: t('reports.tenant_aging_desc'), color: 'bg-red-50 text-red-600' },
    { to: '/reports/occupancy', icon: Home, label: t('reports.occupancy_report'), desc: t('reports.occupancy_report_desc'), color: 'bg-green-50 text-green-600' },
    { to: '/reports/agreements', icon: Users, label: t('reports.agreement_summary'), desc: t('reports.agreement_summary_desc'), color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <ProGate feature="reports">
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('reports.dashboard_title')}</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="!w-auto text-sm">
            <option value="all">{t('reports.all_properties')}</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Button size="sm" variant="secondary" icon={Download} onClick={handleExportPDF}>PDF</Button>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">{t('reports.income_12m')}</p>
          <p className="text-lg font-bold text-gray-900">{formatRM(yearIncome)}</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">{t('reports.avg_collection')}</p>
          <p className="text-lg font-bold text-primary-600">{avgCollection}%</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">{t('reports.occupancy')}</p>
          <p className="text-lg font-bold text-gray-900">{occupancyRate}% <span className="text-sm font-normal text-gray-400">({occupiedRooms}/{totalRooms})</span></p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[11px] text-gray-500">{t('reports.total_arrears')}</p>
          <p className="text-lg font-bold text-red-600">{formatRM(totalArrears)}</p>
        </Card>
      </div>

      {/* Monthly Income Chart */}
      <Card variant="elevated" padding="p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">{t('reports.monthly_income')}</p>
        <div id="chart-monthly-income">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={35} />
              <Tooltip formatter={(v) => formatRM(Number(v))} labelStyle={CHART_FONT} />
              <Bar dataKey="expected" name="Dijangka" fill={CHART_COLORS.neutral} radius={[3, 3, 0, 0]} />
              <Bar dataKey="collected" name="Dikutip" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Collection Trend Line */}
      <Card variant="elevated" padding="p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">{t('reports.collection_trend')}</p>
        <div id="chart-collection-trend">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ ...CHART_FONT, fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" width={35} />
              <Tooltip formatter={(v) => `${v}%`} labelStyle={CHART_FONT} />
              <Line type="monotone" dataKey="collectionRate" name="Kutipan" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Occupancy Donut */}
      <Card variant="elevated" padding="p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">{t('reports.current_occupancy')}</p>
        <div id="chart-occupancy" className="flex items-center justify-center">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: t('reports.occupied'), value: occupiedRooms },
                  { name: t('reports.vacant'), value: totalRooms - occupiedRooms },
                ]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                dataKey="value" strokeWidth={0}
              >
                <Cell fill={CHART_COLORS.primary} />
                <Cell fill={CHART_COLORS.neutral} />
              </Pie>
              <Tooltip formatter={(v) => `${v} bilik`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
              <span className="text-sm text-gray-600">{t('reports.occupied')} ({occupiedRooms})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.neutral }} />
              <span className="text-sm text-gray-600">{t('reports.vacant')} ({totalRooms - occupiedRooms})</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Report links */}
      <div>
        <p className="text-sm font-bold text-gray-800 mb-3">{t('reports.detailed_reports')}</p>
        <div className="grid grid-cols-1 gap-3">
          {reportLinks.map(r => (
            <Link key={r.to} to={r.to} className="block">
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 active:scale-[0.98] transition-all">
                <div className={`w-11 h-11 rounded-xl ${r.color} flex items-center justify-center shrink-0`}>
                  <r.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{r.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{r.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </ProGate>
  )
}
