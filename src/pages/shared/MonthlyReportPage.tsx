import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download } from 'lucide-react'
import type { MonthlyBill, Room, Property, Profile } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import { SkeletonList } from '@/components/ui/Skeleton'
import { downloadCSV } from '@/lib/csv'

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
      .select('*, room:rooms(label, property:properties(name, id)), tenant:profiles!monthly_bills_tenant_id_fkey(name)')
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
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('reports.monthly_title')}</h1>
        <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>
          CSV
        </Button>
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
  )
}
