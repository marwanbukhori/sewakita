import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt, ChevronDown, ChevronUp, CreditCard } from 'lucide-react'
import type { MonthlyBill } from '@/types/database'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'

export default function TenantBillsPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!profile) return
    loadBills()
  }, [profile])

  async function loadBills() {
    const { data } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('tenant_id', profile!.id)
      .order('month', { ascending: false })

    setBills(data || [])
    setLoading(false)
  }

  async function handlePayNow(bill: MonthlyBill) {
    if (!profile) return
    setPaying(true)

    try {
      const amount = bill.total_due - bill.total_paid
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-rent-bill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bill_id: bill.id,
            amount,
            tenant_email: profile.email,
            tenant_name: profile.name,
            description: `${bill.month}`,
            redirect_url: `${window.location.origin}/tenant/payment-success`,
          }),
        }
      )

      const data = await response.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else if (data.error === 'gateway_not_configured') {
        toast.error('Landlord has not set up online payment yet. Please pay manually.')
      } else {
        toast.error(data.message || data.error || 'Payment failed')
      }
    } catch {
      toast.error('Failed to initiate payment')
    }

    setPaying(false)
  }

  if (loading) return <SkeletonList count={3} />

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-')
    const months = t('payments.months', { returnObjects: true }) as string[]
    return `${months[parseInt(month) - 1]} ${year}`
  }

  // Group by month
  const grouped = bills.reduce<Record<string, MonthlyBill[]>>((acc, bill) => {
    if (!acc[bill.month]) acc[bill.month] = []
    acc[bill.month].push(bill)
    return acc
  }, {})

  return (
    <div className="space-y-4 animate-in">
      <h1 className="text-xl font-bold text-gray-800">{t('billing.title')}</h1>

      {bills.length === 0 ? (
        <EmptyState icon={Receipt} title={t('billing.no_history')} />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([month, monthBills]) => (
            <div key={month}>
              <SectionHeader title={formatMonth(month)} />
              <Card variant="elevated" padding="p-0">
                <div className="divide-y divide-gray-100">
                  {monthBills.map((bill) => {
                    const isExpanded = expandedBill === bill.id
                    const hasBalance = bill.total_paid > 0 && bill.status !== 'paid'
                    return (
                      <div key={bill.id}>
                        <button
                          onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{t('billing.rent_utilities')}</p>
                            {hasBalance && (
                              <p className="text-xs text-danger-500">{t('billing.balance')}: RM{bill.total_due - bill.total_paid}</p>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 text-sm shrink-0">RM{bill.total_due}</span>
                          <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3 space-y-3">
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t('billing.room_rent')}</span>
                                <span>RM{bill.rent_amount}</span>
                              </div>
                              {bill.utility_breakdown?.map((u, i) => (
                                u.amount > 0 && (
                                  <div key={i} className="flex justify-between">
                                    <span className="text-gray-500">
                                      {u.type === 'electric' ? t('billing.electricity') : u.type === 'water' ? t('billing.water') : t('billing.internet')}
                                    </span>
                                    <span>RM{u.amount}</span>
                                  </div>
                                )
                              ))}
                              <hr className="border-gray-200" />
                              <div className="flex justify-between font-bold">
                                <span>{t('billing.total')}</span>
                                <span>RM{bill.total_due}</span>
                              </div>
                            </div>
                            {bill.status !== 'paid' && (
                              <Button icon={CreditCard} fullWidth loading={paying} onClick={() => handlePayNow(bill)}>
                                Pay Now — RM{bill.total_due - bill.total_paid}
                              </Button>
                            )}
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
    </div>
  )
}
