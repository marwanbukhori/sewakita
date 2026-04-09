import { useEffect, useState } from 'react'
import { getFlags, updateFlag } from '@/lib/admin-client'
import toast from 'react-hot-toast'

interface FlagEntry {
  id: string
  key: string
  enabled: boolean
  description: string | null
  tier: string
  updated_at: string
}

const tierColors: Record<string, string> = {
  all: 'bg-gray-100 text-gray-700',
  free: 'bg-green-100 text-green-700',
  pro: 'bg-purple-100 text-purple-700',
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { loadFlags() }, [])

  async function loadFlags() {
    try {
      const res = await getFlags()
      setFlags(res.data)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleToggle(flag: FlagEntry) {
    setToggling(flag.key)
    try {
      await updateFlag(flag.key, { enabled: !flag.enabled })
      toast.success(`${flag.key} ${!flag.enabled ? 'enabled' : 'disabled'}`)
      loadFlags()
    } catch (e: any) { toast.error(e.message) }
    finally { setToggling(null) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(7)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div>

  const grouped = flags.reduce<Record<string, FlagEntry[]>>((acc, f) => {
    (acc[f.tier] = acc[f.tier] || []).push(f)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-sm text-gray-500 mt-1">Changes take effect on next page load for users.</p>
      </div>

      {['all', 'pro', 'free'].map(tier => {
        const tierFlags = grouped[tier]
        if (!tierFlags?.length) return null
        return (
          <div key={tier}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tier: {tier}</h2>
            <div className="space-y-2">
              {tierFlags.map(flag => (
                <div key={flag.key} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 font-mono">{flag.key}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColors[flag.tier]}`}>
                        {flag.tier}
                      </span>
                    </div>
                    {flag.description && <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>}
                  </div>
                  <button
                    onClick={() => handleToggle(flag)}
                    disabled={toggling === flag.key}
                    className={`relative w-12 h-7 rounded-full transition-colors ${flag.enabled ? 'bg-green-500' : 'bg-gray-300'} ${toggling === flag.key ? 'opacity-50' : ''}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${flag.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
