import { useEffect, useState } from 'react'
import { getPlans, updatePlan } from '@/lib/admin-client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

interface PlanEntry {
  code: string
  display_name: string
  price_myr: string
  billing_interval: string
  is_active: boolean
  sort_order: number
  subscriber_count: number
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ display_name: '', price_myr: '', is_active: true, sort_order: 0 })

  useEffect(() => { loadPlans() }, [])

  async function loadPlans() {
    try {
      const res = await getPlans()
      setPlans(res.data)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function startEdit(plan: PlanEntry) {
    setEditing(plan.code)
    setForm({ display_name: plan.display_name, price_myr: plan.price_myr, is_active: plan.is_active, sort_order: plan.sort_order })
  }

  async function saveEdit(code: string) {
    try {
      await updatePlan(code, { ...form, price_myr: parseFloat(form.price_myr) })
      toast.success(`Updated ${code}`)
      setEditing(null)
      loadPlans()
    } catch (e: any) { toast.error(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Plans & Pricing</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        Changing prices affects new subscriptions only. Existing subscriptions keep their current price until renewal.
      </div>

      <div className="space-y-3">
        {plans.map(plan => (
          <div key={plan.code} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{plan.display_name}</p>
                  <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{plan.code}</span>
                  {!plan.is_active && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">INACTIVE</span>}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-lg font-bold text-gray-900">RM{parseFloat(plan.price_myr).toFixed(2)}</p>
                  <span className="text-xs text-gray-500">/{plan.billing_interval}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {plan.subscriber_count} subscriber{plan.subscriber_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {editing === plan.code ? (
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => saveEdit(plan.code)}>Save</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => startEdit(plan)}>Edit</Button>
              )}
            </div>

            {editing === plan.code && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Display Name</label>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Price (RM)</label>
                  <input type="number" step="0.01" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1" value={form.price_myr} onChange={e => setForm(f => ({ ...f, price_myr: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Sort Order</label>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                    Active
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
