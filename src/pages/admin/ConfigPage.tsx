import { useEffect, useState } from 'react'
import { getConfig, updateConfig, createConfig } from '@/lib/admin-client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface ConfigEntry {
  id: string
  key: string
  value: unknown
  description: string | null
  category: string
  updated_at: string
}

export default function ConfigPage() {
  const [entries, setEntries] = useState<ConfigEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({ key: '', value: '', description: '', category: 'limits' })

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    try {
      const res = await getConfig()
      setEntries(res.data)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function startEdit(entry: ConfigEntry) {
    setEditingKey(entry.key)
    setEditValue(typeof entry.value === 'string' ? JSON.stringify(entry.value) : JSON.stringify(entry.value, null, 2))
  }

  async function saveEdit(key: string) {
    try {
      const parsed = JSON.parse(editValue)
      await updateConfig(key, parsed)
      toast.success(`Updated ${key}`)
      setEditingKey(null)
      loadConfig()
    } catch (e: any) {
      toast.error(e.message || 'Invalid JSON')
    }
  }

  async function handleCreate() {
    try {
      const parsed = JSON.parse(newEntry.value)
      await createConfig({ key: newEntry.key, value: parsed, description: newEntry.description, category: newEntry.category })
      toast.success(`Created ${newEntry.key}`)
      setShowAdd(false)
      setNewEntry({ key: '', value: '', description: '', category: 'limits' })
      loadConfig()
    } catch (e: any) {
      toast.error(e.message || 'Invalid JSON')
    }
  }

  const categories = [...new Set(entries.map(e => e.category))].sort()

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Site Config</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add'}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Key" value={newEntry.key} onChange={e => setNewEntry(p => ({ ...p, key: e.target.value }))} />
            <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={newEntry.category} onChange={e => setNewEntry(p => ({ ...p, category: e.target.value }))}>
              {['limits', 'subscription', 'notification', 'content'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Description" value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700">Value (JSON)</label>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono mt-1" rows={3} value={newEntry.value} onChange={e => setNewEntry(p => ({ ...p, value: e.target.value }))} placeholder='"string" or 42 or [1,2,3]' />
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate}>Create</Button>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat}</h2>
          <div className="space-y-2">
            {entries.filter(e => e.category === cat).map(entry => (
              <div key={entry.key} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 font-mono">{entry.key}</p>
                    {entry.description && <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">Updated {new Date(entry.updated_at).toLocaleString()}</p>
                  </div>
                  {editingKey === entry.key ? (
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => saveEdit(entry.key)}>Save</Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditingKey(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => startEdit(entry)}>Edit</Button>
                  )}
                </div>
                {editingKey === entry.key ? (
                  <textarea className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm font-mono mt-3 focus:ring-2 focus:ring-primary-200" rows={typeof entry.value === 'object' ? 4 : 1} value={editValue} onChange={e => setEditValue(e.target.value)} />
                ) : (
                  <pre className="mt-2 text-sm font-mono text-gray-700 bg-gray-50 rounded-lg px-3 py-2 overflow-x-auto">
                    {JSON.stringify(entry.value, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
