import { useEffect, useState } from 'react'
import { getBillGeneration } from '@/lib/admin-client'
import toast from 'react-hot-toast'

export default function BillGenerationPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { load() }, [page])

  async function load() {
    setLoading(true)
    try { const r = await getBillGeneration({ page }); setEntries(r.data); setTotal(r.total) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Bill Generation Log</h1>
      <p className="text-sm text-gray-500">Auto-generated bills from the daily cron job.</p>

      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {entries.map((e: any) => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{e.property?.name || e.property_id}</p>
                <p className="text-xs text-gray-500">Month: {e.month} | {e.bills_created} bills created | by {e.triggered_by}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-gray-500">No bill generation logs.</p>}
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
