import { useEffect, useState } from 'react'
import { getPromoCodes, createPromoCode, updatePromoCode } from '@/lib/admin-client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ code: '', plan_code: 'pro_monthly', max_uses: 30, permanent: false, expires_at: '' })

  useEffect(() => { load() }, [])
  async function load() {
    try { setCodes((await getPromoCodes()).data) } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    try {
      await createPromoCode({ ...form, expires_at: form.expires_at || undefined })
      toast.success(`Created ${form.code}`)
      setShowCreate(false)
      setForm({ code: '', plan_code: 'pro_monthly', max_uses: 30, permanent: false, expires_at: '' })
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  async function deactivate(id: string, code: string) {
    if (!confirm(`Deactivate ${code}?`)) return
    try { await updatePromoCode(id, { expires_at: new Date().toISOString() }); toast.success(`Deactivated ${code}`); load() }
    catch (e: any) { toast.error(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Promo Codes</h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ Create'}</Button>
      </div>
      {showCreate && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PROMO2026" />
            <div><label className="text-sm font-medium text-gray-700">Plan</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1" value={form.plan_code} onChange={e => setForm(f => ({ ...f, plan_code: e.target.value }))}>
                <option value="pro_monthly">Pro Monthly</option><option value="pro_annual">Pro Annual</option>
              </select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Max Uses" type="number" value={String(form.max_uses)} onChange={e => setForm(f => ({ ...f, max_uses: parseInt(e.target.value) || 0 }))} />
            <div><label className="text-sm font-medium text-gray-700">Expires</label>
              <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
            <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.permanent} onChange={e => setForm(f => ({ ...f, permanent: e.target.checked }))} className="rounded" />Permanent</label></div>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate}>Create</Button>
        </div>
      )}
      <div className="space-y-2">
        {codes.map((c: any) => {
          const expired = c.expires_at && new Date(c.expires_at) < new Date()
          return (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-gray-900">{c.code}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{c.plan_code}</span>
                  {c.permanent && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">PERMANENT</span>}
                  {expired && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">EXPIRED</span>}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (c.current_uses / c.max_uses) * 100)}%` }} /></div>
                    <span className="text-xs text-gray-500">{c.current_uses}/{c.max_uses}</span>
                  </div>
                </div>
              </div>
              {!expired && <Button variant="secondary" size="sm" onClick={() => deactivate(c.id, c.code)}>Deactivate</Button>}
            </div>
          )
        })}
        {codes.length === 0 && <p className="text-sm text-gray-500">No promo codes yet.</p>}
      </div>
    </div>
  )
}
