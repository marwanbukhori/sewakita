import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { PaymentClaim, MonthlyBill, Profile } from '@/types/database'
import { Check, X, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import StatusBadge from '@/components/ui/StatusBadge'

export interface ClaimWithDetails extends PaymentClaim {
  tenant: Profile
  bill: MonthlyBill
  room_label?: string
  property_name?: string
}

interface Props {
  claim: ClaimWithDetails | null
  onClose: () => void
  onActioned: () => void
}

export default function PaymentClaimReview({ claim, onClose, onActioned }: Props) {
  const { profile } = useAuth()
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!claim) return null

  const balance = claim.bill.total_due - claim.bill.total_paid

  async function handleApprove() {
    if (!claim || !profile) return
    setLoading(true)
    try {
      // 1. Update claim status
      await supabase.from('payment_claims').update({
        status: 'approved',
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', claim.id)

      // 2. Create actual payment row
      await supabase.from('payments').insert({
        bill_id: claim.bill_id,
        amount: claim.amount,
        date: claim.paid_date,
        method: claim.method,
        receipt_sent: false,
        notes: claim.notes || undefined,
      })

      // 3. Update bill totals
      const newTotalPaid = Number(claim.bill.total_paid) + Number(claim.amount)
      await supabase.from('monthly_bills').update({
        total_paid: newTotalPaid,
        status: newTotalPaid >= Number(claim.bill.total_due) ? 'paid' : 'partial',
      }).eq('id', claim.bill_id)

      toast.success('Payment approved and recorded')
      onActioned()
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!claim || !profile) return
    setLoading(true)
    try {
      await supabase.from('payment_claims').update({
        status: 'rejected',
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: rejectReason || undefined,
        updated_at: new Date().toISOString(),
      }).eq('id', claim.id)

      toast.success('Claim rejected')
      setShowReject(false)
      setRejectReason('')
      onActioned()
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to reject')
    } finally {
      setLoading(false)
    }
  }

  function getProofUrl(): string | null {
    if (!claim?.proof_url) return null
    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(claim!.proof_url)
    return data?.publicUrl || null
  }

  const proofUrl = getProofUrl()
  const methodLabels: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    duitnow: 'DuitNow',
    cash: 'Cash',
    other: 'Other',
  }

  return (
    <BottomSheet open={!!claim} onClose={onClose} title="Review Payment Claim">
      <div className="space-y-4">
        {/* Tenant + context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
            <span className="text-sm font-bold text-primary-600">{claim.tenant?.name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{claim.tenant?.name}</p>
            <p className="text-xs text-gray-500">{claim.property_name} — {claim.room_label}</p>
          </div>
        </div>

        {/* Claim details */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Claimed</span>
            <span className="font-bold text-gray-900">RM {Number(claim.amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Method</span>
            <span>{methodLabels[claim.method] || claim.method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date Paid</span>
            <span>{claim.paid_date}</span>
          </div>
          {claim.notes && (
            <div className="flex justify-between">
              <span className="text-gray-500">Notes</span>
              <span className="text-right max-w-[60%] text-gray-700">{claim.notes}</span>
            </div>
          )}
          <hr className="border-gray-200" />
          <div className="flex justify-between">
            <span className="text-gray-500">Bill Total</span>
            <span>RM {Number(claim.bill.total_due).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Already Paid</span>
            <span>RM {Number(claim.bill.total_paid).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Balance</span>
            <span>RM {balance.toFixed(2)}</span>
          </div>
        </div>

        {/* Proof photo */}
        {proofUrl ? (
          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block">
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img src={proofUrl} alt="Payment proof" className="w-full max-h-48 object-contain bg-gray-100" />
            </div>
            <p className="text-xs text-primary-600 mt-1">Tap to view full size</p>
          </a>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Image size={14} /> No proof photo attached
          </div>
        )}

        {/* Actions */}
        {!showReject ? (
          <div className="flex gap-2 pt-2">
            <Button variant="danger" size="sm" icon={X} className="flex-1" onClick={() => setShowReject(true)}>
              Reject
            </Button>
            <Button size="sm" icon={Check} className="flex-1" loading={loading} onClick={handleApprove}>
              Approve
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <Input
              label="Reason for rejection (optional)"
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Amount doesn't match, no proof"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowReject(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" className="flex-1" loading={loading} onClick={handleReject}>
                Confirm Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
