import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { FileCheck, ArrowLeft } from 'lucide-react'
import type { PaymentClaim } from '@/types/database'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'

interface ClaimWithMonth extends PaymentClaim {
  bill: { month: string }
}

const statusMap: Record<string, 'pending' | 'paid' | 'overdue'> = {
  pending: 'pending',
  approved: 'paid',
  rejected: 'overdue',
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  duitnow: 'DuitNow',
  cash: 'Cash',
  other: 'Other',
}

export default function TenantClaimsPage() {
  const { profile } = useAuth()
  const [claims, setClaims] = useState<ClaimWithMonth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadClaims()
  }, [profile])

  async function loadClaims() {
    const { data } = await supabase
      .from('payment_claims')
      .select('*, bill:monthly_bills!payment_claims_bill_id_fkey(month)')
      .eq('tenant_id', profile!.id)
      .order('created_at', { ascending: false })
    setClaims((data || []) as ClaimWithMonth[])
    setLoading(false)
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center gap-3">
        <Link to="/tenant/bills" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">My Payment Claims</h1>
      </div>

      {claims.length === 0 ? (
        <EmptyState icon={FileCheck} title="No claims yet" />
      ) : (
        <Card variant="elevated" padding="p-0">
          <div className="divide-y divide-gray-100">
            {claims.map((claim) => (
              <div key={claim.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    RM {Number(claim.amount).toFixed(2)}
                  </span>
                  <StatusBadge status={statusMap[claim.status] || 'pending'} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{claim.bill?.month}</span>
                  <span>·</span>
                  <span>{methodLabels[claim.method] || claim.method}</span>
                  <span>·</span>
                  <span>{claim.paid_date}</span>
                </div>
                {claim.status === 'rejected' && claim.reject_reason && (
                  <p className="text-xs text-red-600 mt-1">Rejected: {claim.reject_reason}</p>
                )}
                {claim.status === 'approved' && (
                  <p className="text-xs text-green-600 mt-1">Payment recorded</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
