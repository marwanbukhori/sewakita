import { useEffect, useState } from 'react'
import { getCronHealth } from '@/lib/admin-client'
import toast from 'react-hot-toast'

const CRON_JOBS = ['auto-generate-bills', 'overdue-reminder', 'subscription-renewal']

export default function CronHealthPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try { setRuns((await getCronHealth()).data) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function getLatest(fn: string) {
    return runs.find((r: any) => r.function_name === fn)
  }

  function hoursAgo(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
  }

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Cron Health</h1>
      <p className="text-sm text-gray-500">Last run status for each scheduled job. Requires Phase 7 (cron_run_log table) for real data.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CRON_JOBS.map(fn => {
          const run = getLatest(fn)
          const stale = run?.completed_at && hoursAgo(run.completed_at) > 25
          return (
            <div key={fn} className={`bg-white rounded-xl p-5 shadow-sm border-2 ${stale ? 'border-red-300' : run?.status === 'success' ? 'border-green-200' : run?.status === 'failed' ? 'border-red-200' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${run?.status === 'success' ? 'bg-green-500' : run?.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                <h3 className="text-sm font-bold text-gray-900">{fn}</h3>
              </div>
              {run ? (
                <>
                  <p className="text-xs text-gray-500">Last run: {new Date(run.completed_at || run.started_at).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{hoursAgo(run.completed_at || run.started_at)}h ago</p>
                  {run.summary && <pre className="text-xs bg-gray-50 rounded p-2 mt-2 overflow-x-auto">{JSON.stringify(run.summary, null, 2)}</pre>}
                  {run.error && <p className="text-xs text-red-500 mt-2">{run.error}</p>}
                  {stale && <p className="text-xs text-red-600 font-semibold mt-2">Missed schedule (&gt;25h ago)</p>}
                </>
              ) : (
                <p className="text-xs text-gray-400">Never run (cron_run_log not yet populated)</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
