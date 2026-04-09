import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserDetail, updateUserSubscription, toggleUserAdmin } from '@/lib/admin-client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'properties' | 'payments' | 'activity'>('properties')

  useEffect(() => { load() }, [id])
  async function load() {
    if (!id) return
    try { setData((await getUserDetail(id)).data) } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function extendSub() {
    const days = prompt('Extend by how many days?', '30')
    if (!days) return
    try { await updateUserSubscription(id!, { action: 'extend', period_end: new Date(Date.now() + parseInt(days) * 86400000).toISOString() }); toast.success('Extended'); load() }
    catch (e: any) { toast.error(e.message) }
  }
  async function cancelSub() {
    if (!confirm('Cancel subscription?')) return
    try { await updateUserSubscription(id!, { action: 'cancel' }); toast.success('Cancelled'); load() }
    catch (e: any) { toast.error(e.message) }
  }
  async function handleToggleAdmin() {
    const newVal = !data.profile.is_admin
    if (!confirm(`${newVal ? 'Grant' : 'Remove'} admin?`)) return
    try { await toggleUserAdmin(id!, newVal); toast.success(newVal ? 'Admin granted' : 'Admin removed'); load() }
    catch (e: any) { toast.error(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div>
  if (!data) return <p className="text-gray-500">User not found.</p>
  const { profile, subscription, properties, payments, activity } = data
  const subColors: Record<string, string> = { active: 'bg-green-100 text-green-700', past_due: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-700' }

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">&larr; Back to Users</Link>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${profile.role === 'landlord' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{profile.role}</span>
              {profile.is_admin && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">ADMIN</span>}
            </div>
            <p className="text-xs text-gray-400 mt-2">Phone: {profile.phone || '—'} | Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
          {profile.role === 'landlord' && <Button variant="secondary" size="sm" onClick={handleToggleAdmin}>{profile.is_admin ? 'Remove Admin' : 'Make Admin'}</Button>}
        </div>
      </div>

      {profile.role === 'landlord' && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Subscription</h2>
          {subscription ? (<>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold">{subscription.plan?.display_name || subscription.plan_code}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${subColors[subscription.status] || 'bg-gray-100'}`}>{subscription.status}</span>
            </div>
            <p className="text-xs text-gray-500">Period: {new Date(subscription.period_start).toLocaleDateString()} — {new Date(subscription.period_end).toLocaleDateString()}</p>
            <div className="flex gap-2 mt-3">
              <Button variant="primary" size="sm" onClick={extendSub}>Extend</Button>
              {['active', 'past_due'].includes(subscription.status) && <Button variant="danger" size="sm" onClick={cancelSub}>Cancel</Button>}
            </div>
          </>) : <p className="text-sm text-gray-500">Free tier</p>}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(['properties', 'payments', 'activity'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'properties' && <div className="space-y-2">{properties.length ? properties.map((p: any) => (
        <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-gray-500">{p.address}</p>
          <span className="text-xs text-gray-400">{p.rooms?.length || 0} rooms, {p.rooms?.filter((r: any) => r.status === 'occupied').length || 0} occupied</span>
        </div>
      )) : <p className="text-sm text-gray-500">No properties.</p>}</div>}

      {tab === 'payments' && <div className="space-y-2">{payments.length ? payments.map((p: any) => (
        <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between">
          <div><p className="text-sm font-semibold">RM{parseFloat(p.amount).toFixed(2)}</p><p className="text-xs text-gray-500">{p.method} | {p.bill?.month || '—'}</p></div>
          <div className="text-right"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.gateway_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{p.gateway_status || 'manual'}</span><p className="text-xs text-gray-400 mt-1">{new Date(p.date).toLocaleDateString()}</p></div>
        </div>
      )) : <p className="text-sm text-gray-500">No payments.</p>}</div>}

      {tab === 'activity' && <div className="space-y-2">{activity.length ? activity.map((a: any) => (
        <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a.type}</span><span className="text-sm">{a.title}</span></div>
          {a.detail && <p className="text-xs text-gray-500 mt-1">{a.detail}</p>}
          <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
        </div>
      )) : <p className="text-sm text-gray-500">No activity.</p>}</div>}
    </div>
  )
}
