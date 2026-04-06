import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Link } from 'react-router-dom'
import { Receipt, ChevronDown, ChevronUp, CreditCard, Upload, FileCheck } from 'lucide-react'
import type { MonthlyBill } from '@/types/database'
import PaymentClaimSheet from '@/components/tenant/PaymentClaimSheet'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import BillDueBadge from '@/components/tenant/BillDueBadge'
import UtilityLineExplainer from '@/components/tenant/UtilityLineExplainer'

export default function TenantBillsPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [claimBill, setClaimBill] = useState<MonthlyBill | null>(null)
  const [pendingClaimBillIds, setPendingClaimBillIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!profile) return
    loadBills()
    loadPendingClaims()
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

  async function loadPendingClaims() {
    const { data } = await supabase
      .from('payment_claims')
      .select('bill_id')
      .eq('tenant_id', profile!.id)
      .eq('status', 'pending')
    setPendingClaimBillIds(new Set((data || []).map(c => c.bill_id)))
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('billing.title')}</h1>
        {pendingClaimBillIds.size > 0 && (
          <Link to="/tenant/claims" className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700">
            <FileCheck size={14} />
            My claims ({pendingClaimBillIds.size})
          </Link>
        )}
      </div>

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
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">RM{bill.total_due}</span>
                              <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                            </div>
                            {bill.due_date && bill.status !== 'paid' && (
                              <BillDueBadge dueDate={bill.due_date} status={bill.status} />
                            )}
                          </div>
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
                                  <div key={i} className="flex justify-between items-center">
                                    <span className="text-gray-500 flex items-center gap-1">
                                      {u.type === 'electric' ? t('billing.electricity') : u.type === 'water' ? t('billing.water') : t('billing.internet')}
                                      <UtilityLineExplainer type={u.type} amount={u.amount} splitMethod={u.split_method} />
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
                              <div className="space-y-2">
                                <Button icon={CreditCard} fullWidth loading={paying} onClick={() => handlePayNow(bill)}>
                                  Pay Now — RM{bill.total_due - bill.total_paid}
                                </Button>
                                {pendingClaimBillIds.has(bill.id) ? (
                                  <div className="text-center text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                                    Claim pending — waiting for landlord review
                                  </div>
                                ) : (
                                  <Button icon={Upload} fullWidth variant="secondary" onClick={() => setClaimBill(bill)}>
                                    I've Paid
                                  </Button>
                                )}
                              </div>
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

      <PaymentClaimSheet
        open={!!claimBill}
        onClose={() => setClaimBill(null)}
        bill={claimBill}
        onSubmitted={() => { loadBills(); loadPendingClaims() }}
      />
    </div>
  )
}
