import { useEffect, useState } from 'react'
import { getPayments } from '@/lib/admin-client'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { load() }, [status, from, to, page])

  async function load() {
    setLoading(true)
    try { const r = await getPayments({ status, from, to, page }); setPayments(r.data); setTotal(r.total) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Payment Audit</h1>
      <div className="flex flex-wrap gap-3">
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option>
        </select>
        <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} />
        <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} />
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {payments.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">RM{parseFloat(p.amount).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{p.method} | {p.bill?.property?.name || '—'} | {p.bill?.month || '—'}</p>
                {p.bill?.property?.landlord && <p className="text-xs text-gray-400">{p.bill.property.landlord.name} ({p.bill.property.landlord.email})</p>}
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.gateway_status === 'paid' ? 'bg-green-100 text-green-700' : p.gateway_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{p.gateway_status || p.gateway || 'manual'}</span>
                <p className="text-xs text-gray-400 mt-1">{new Date(p.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="text-sm text-gray-500">No payments found.</p>}
        </div>
      )}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button disabled={payments.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
