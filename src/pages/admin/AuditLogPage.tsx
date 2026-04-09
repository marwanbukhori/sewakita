import { useEffect, useState } from 'react'
import { getAuditLog } from '@/lib/admin-client'
import toast from 'react-hot-toast'

interface AuditEntry {
  id: string
  table_name: string
  record_key: string
  action: string
  old_value: unknown
  new_value: unknown
  changed_by_profile?: { name: string; email: string } | null
  changed_at: string
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tableFilter, setTableFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { loadAudit() }, [tableFilter, page])

  async function loadAudit() {
    setLoading(true)
    try {
      const res = await getAuditLog({ table: tableFilter, page })
      setEntries(res.data)
      setTotal(res.total)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const tables = ['site_config', 'feature_flags', 'plans', 'promo_codes']

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>

      <div className="flex gap-2">
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={tableFilter} onChange={e => { setTableFilter(e.target.value); setPage(1) }}>
          <option value="">All tables</option>
          {tables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No audit entries found.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm">
              <button className="w-full p-4 text-left" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${actionColors[entry.action] || 'bg-gray-100 text-gray-700'}`}>
                    {entry.action}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{entry.table_name}</span>
                  <span className="text-sm font-semibold text-gray-900 font-mono">{entry.record_key}</span>
                  <span className="flex-1" />
                  <span className="text-xs text-gray-400">{new Date(entry.changed_at).toLocaleString()}</span>
                </div>
                {entry.changed_by_profile && (
                  <p className="text-xs text-gray-500 mt-1">by {entry.changed_by_profile.name}</p>
                )}
              </button>
              {expanded === entry.id && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Old Value</p>
                    <pre className="text-xs font-mono bg-red-50 text-red-800 rounded-lg p-3 overflow-x-auto">
                      {entry.old_value ? JSON.stringify(entry.old_value, null, 2) : '(none)'}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">New Value</p>
                    <pre className="text-xs font-mono bg-green-50 text-green-800 rounded-lg p-3 overflow-x-auto">
                      {entry.new_value ? JSON.stringify(entry.new_value, null, 2) : '(none)'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
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
