import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUsers } from '@/lib/admin-client'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { load() }, [role, page, search])

  async function load() {
    setLoading(true)
    try {
      const res = await getUsers({ search, role, page })
      setUsers(res.data); setTotal(res.total)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const roleColors: Record<string, string> = { landlord: 'bg-blue-100 text-blue-700', tenant: 'bg-green-100 text-green-700' }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Users</h1>
      <div className="flex gap-3">
        <div className="flex-1"><Input placeholder="Search email or name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></div>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={role} onChange={e => { setRole(e.target.value); setPage(1) }}>
          <option value="">All</option><option value="landlord">Landlord</option><option value="tenant">Tenant</option>
        </select>
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <Link key={u.id} to={`/admin/users/${u.id}`} className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-gray-100'}`}>{u.role}</span>
                    {u.is_admin && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">ADMIN</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {users.length === 0 && <p className="text-sm text-gray-500">No users found.</p>}
        </div>
      )}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button disabled={users.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
