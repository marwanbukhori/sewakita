import { useEffect, useState } from 'react'
import { getActivity } from '@/lib/admin-client'
import toast from 'react-hot-toast'

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { load() }, [type, page])

  async function load() {
    setLoading(true)
    try { const r = await getActivity({ type, page }); setEntries(r.data); setTotal(r.total) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
      <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
        <option value="">All types</option>
        <option value="payment_received">payment_received</option>
        <option value="bill_generated">bill_generated</option>
        <option value="promo_redeemed">promo_redeemed</option>
        <option value="utility_scanned">utility_scanned</option>
      </select>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {entries.map((e: any) => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{e.type}</span>
                  <span className="text-sm text-gray-900">{e.title}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
              </div>
              {e.landlord && <p className="text-xs text-gray-500 mt-1">{e.landlord.name} ({e.landlord.email})</p>}
              {e.detail && <p className="text-xs text-gray-400 mt-1">{e.detail}</p>}
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-gray-500">No activity found.</p>}
        </div>
      )}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button disabled={entries.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
