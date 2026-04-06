import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { MonthlyBill, PaymentMethod } from '@/types/database'
import toast from 'react-hot-toast'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface Props {
  open: boolean
  onClose: () => void
  bill: MonthlyBill | null
  onSubmitted: () => void
}

export default function PaymentClaimSheet({ open, onClose, bill, onSubmitted }: Props) {
  const { profile } = useAuth()
  const balance = bill ? bill.total_due - bill.total_paid : 0
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reset when bill changes
  function resetForm() {
    setAmount('')
    setMethod('bank_transfer')
    setPaidDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setPhoto(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bill || !profile) return

    const parsedAmount = parseFloat(amount || String(balance))
    if (parsedAmount <= 0 || parsedAmount > balance) {
      toast.error(`Amount must be between RM 0.01 and RM ${balance.toFixed(2)}`)
      return
    }
    if (new Date(paidDate) > new Date()) {
      toast.error('Date cannot be in the future')
      return
    }

    setSubmitting(true)
    try {
      let proofUrl: string | undefined

      // Upload proof photo if provided
      if (photo) {
        const ext = photo.name.split('.').pop() || 'jpg'
        const path = `${profile.id}/${bill.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(path, photo, { contentType: photo.type })
        if (uploadErr) throw new Error('Photo upload failed: ' + uploadErr.message)
        proofUrl = path
      }

      const { error } = await supabase.from('payment_claims').insert({
        bill_id: bill.id,
        tenant_id: profile.id,
        amount: parsedAmount,
        method,
        paid_date: paidDate,
        proof_url: proofUrl,
        notes: notes || undefined,
      })

      if (error) throw error

      toast.success('Payment claim submitted. Your landlord will review it.')
      resetForm()
      onSubmitted()
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to submit claim')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="I've Paid">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`Amount (balance: RM ${balance.toFixed(2)})`}
          type="number"
          step="0.01"
          min="0.01"
          max={balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={balance.toFixed(2)}
        />

        <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="duitnow">DuitNow</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </Select>

        <Input
          label="Date Paid"
          type="date"
          value={paidDate}
          onChange={(e) => setPaidDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Proof of Payment (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {photo && (
            <p className="text-xs text-gray-500">{photo.name} ({(photo.size / 1024).toFixed(0)} KB)</p>
          )}
        </div>

        <Input
          label="Notes (optional)"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Transfer ref #12345"
        />

        <Button type="submit" fullWidth loading={submitting}>
          Submit Claim
        </Button>
      </form>
    </BottomSheet>
  )
}
