import { useEffect, useState } from 'react'
import { getPaymentClaims, updatePaymentClaim } from '@/lib/admin-client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

export default function PaymentClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { load() }, [status, page])

  async function load() {
    setLoading(true)
    try { const r = await getPaymentClaims({ status, page }); setClaims(r.data); setTotal(r.total) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    const reason = action === 'rejected' ? prompt('Rejection reason:') : undefined
    if (action === 'rejected' && reason === null) return
    try { await updatePaymentClaim(id, { status: action, reject_reason: reason || undefined }); toast.success(`Claim ${action}`); load() }
    catch (e: any) { toast.error(e.message) }
  }

  const pendingCount = claims.filter(c => c.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Payment Claims</h1>
        {pendingCount > 0 && <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">{pendingCount} pending</span>}
      </div>
      <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
        <option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {claims.map((c: any) => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[c.status] || 'bg-gray-100'}`}>{c.status}</span>
                    <span className="text-sm font-semibold">RM{parseFloat(c.amount).toFixed(2)}</span>
                    <span className="text-xs text-gray-500">{c.method}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tenant: {c.tenant?.name || '—'} | Property: {c.bill?.property?.name || '—'}</p>
                  <p className="text-xs text-gray-400">Landlord: {c.bill?.property?.landlord?.name || '—'} | Paid: {c.paid_date ? new Date(c.paid_date).toLocaleDateString() : '—'}</p>
                  {c.notes && <p className="text-xs text-gray-500 mt-1 italic">{c.notes}</p>}
                  {c.reject_reason && <p className="text-xs text-red-500 mt-1">Rejected: {c.reject_reason}</p>}
                </div>
                {c.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button variant="primary" size="sm" onClick={() => handleAction(c.id, 'approved')}>Approve</Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(c.id, 'rejected')}>Reject</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {claims.length === 0 && <p className="text-sm text-gray-500">No payment claims found.</p>}
        </div>
      )}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button disabled={claims.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
