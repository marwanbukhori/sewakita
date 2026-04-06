import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download, FileDown } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { RentAgreement, Property, Room, Profile } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { downloadCSV } from '@/lib/csv'
import { CHART_COLORS, CHART_FONT } from '@/lib/chart-theme'
import { createReportPDF, addChartToPage, addStatCard, addTableRows, saveReport, captureChart } from '@/lib/report-pdf'

interface AgreementWithDetails extends RentAgreement {
  property: Property
  room: Room
  tenant: Profile | null
}

export default function AgreementReportPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [agreements, setAgreements] = useState<AgreementWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    const { data } = await supabase
      .from('rent_agreements')
      .select('*, property:properties(name, id), room:rooms(label), tenant:profiles!rent_agreements_tenant_id_fkey(name)')
      .eq('landlord_id', profile!.id)
      .order('created_at', { ascending: false })

    setAgreements((data || []) as AgreementWithDetails[])
    setLoading(false)
  }

  const now = new Date()
  const active = agreements.filter(a => a.status === 'signed')
  const draft = agreements.filter(a => a.status === 'draft' || a.status === 'sent')
  const expired = agreements.filter(a => a.status === 'expired' || a.status === 'terminated')
  const expiringSoon = active.filter(a => {
    if (!a.end_date) return false
    const end = new Date(a.end_date)
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 30
  })

  const statusData = [
    { name: t('reports.agreement_active'), value: active.length, color: CHART_COLORS.success },
    { name: t('reports.agreement_draft'), value: draft.length, color: CHART_COLORS.neutral },
    { name: t('reports.agreement_expired'), value: expired.length, color: CHART_COLORS.danger },
  ].filter(d => d.value > 0)

  function handleExportCSV() {
    downloadCSV('sewakita-perjanjian.csv',
      ['Penyewa', 'Hartanah', 'Bilik', 'Mula', 'Tamat', 'Status'],
      agreements.map(a => [a.tenant?.name || '-', a.property?.name || '', a.room?.label || '', a.start_date, a.end_date || '-', a.status])
    )
  }

  async function handleExportPDF() {
    const doc = createReportPDF('Ringkasan Perjanjian Sewa', new Date().toLocaleDateString('ms-MY'))
    let y = 50
    addStatCard(doc, 'Jumlah', `${agreements.length}`, 20, y)
    addStatCard(doc, 'Aktif', `${active.length}`, 65, y)
    addStatCard(doc, 'Hampir tamat', `${expiringSoon.length}`, 110, y)
    y += 28
    try {
      const img = await captureChart('chart-agreement-status')
      y = addChartToPage(doc, img, y, 60)
    } catch { /* */ }
    y = addTableRows(doc,
      ['Penyewa', 'Hartanah', 'Bilik', 'Mula', 'Tamat', 'Status'],
      agreements.map(a => [a.tenant?.name || '-', a.property?.name || '', a.room?.label || '', a.start_date, a.end_date || '-', a.status]),
      y
    )
    saveReport(doc, 'Perjanjian', new Date().toISOString().slice(0, 7))
  }

  function getStatusColor(status: string) {
    if (status === 'signed') return 'paid'
    if (status === 'draft' || status === 'sent') return 'pending'
    return 'overdue'
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>{t('common.back')}</Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('reports.agreement_title')}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>CSV</Button>
          <Button variant="ghost" size="sm" icon={FileDown} onClick={handleExportPDF}>PDF</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <Card variant="elevated" padding="p-3">
          <p className="text-[10px] text-gray-500">{t('reports.agreement_total')}</p>
          <p className="text-lg font-bold text-gray-900">{agreements.length}</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[10px] text-gray-500">{t('reports.agreement_active')}</p>
          <p className="text-lg font-bold text-green-600">{active.length}</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[10px] text-gray-500">{t('reports.agreement_expiring')}</p>
          <p className="text-lg font-bold text-amber-600">{expiringSoon.length}</p>
        </Card>
        <Card variant="elevated" padding="p-3">
          <p className="text-[10px] text-gray-500">{t('reports.agreement_expired')}</p>
          <p className="text-lg font-bold text-red-600">{expired.length}</p>
        </Card>
      </div>

      {/* Status donut */}
      {statusData.length > 0 && (
        <Card variant="elevated" padding="p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">{t('reports.agreement_status_dist')}</p>
          <div id="chart-agreement-status" className="flex items-center justify-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} perjanjian`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {statusData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-gray-600">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Agreement list */}
      {agreements.length === 0 ? (
        <Card variant="elevated" padding="p-6" className="text-center">
          <p className="text-sm text-gray-400">Tiada perjanjian sewa.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {agreements.map(a => {
            const daysUntilEnd = a.end_date ? Math.ceil((new Date(a.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
            const isExpiring = daysUntilEnd !== null && daysUntilEnd >= 0 && daysUntilEnd <= 30

            return (
              <Link key={a.id} to={`/agreements/${a.id}`}>
                <Card variant="elevated" padding="p-3" className="hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{a.tenant?.name || t('properties.not_assigned', 'Not assigned')}</p>
                        {isExpiring && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                            {daysUntilEnd}d lagi
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">{a.property?.name} · {a.room?.label}</p>
                      <p className="text-[11px] text-gray-400">{a.start_date} → {a.end_date || '∞'}</p>
                    </div>
                    <StatusBadge status={getStatusColor(a.status) as 'paid' | 'pending' | 'overdue'} />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
