import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Users, Plus, Phone, Mail } from 'lucide-react'
import type { Profile, Tenancy, Room, Property } from '@/types/database'

interface TenantWithTenancy extends Profile {
  tenancies: (Tenancy & { room: Room & { property: Property } })[]
}

export default function TenantsPage() {
  const { profile } = useAuth()
  const [tenants, setTenants] = useState<TenantWithTenancy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadTenants()
  }, [profile])

  async function loadTenants() {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        tenancies(
          *,
          room:rooms(*, property:properties(*))
        )
      `)
      .eq('role', 'tenant')
      .order('name')

    // Filter to only show tenants associated with this landlord's properties
    const myTenants = (data || []).filter((t: TenantWithTenancy) =>
      t.tenancies?.some((tn) => tn.room?.property?.landlord_id === profile!.id)
    )

    setTenants(myTenants)
    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Penyewa</h1>
        <Link
          to="/tenants/new"
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Tambah
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Users className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">Tiada penyewa lagi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => {
            const activeTenancy = tenant.tenancies?.find((t) => t.status === 'active')
            return (
              <Link
                key={tenant.id}
                to={`/tenants/${tenant.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Phone size={12} /> {tenant.phone}</span>
                      <span className="flex items-center gap-1"><Mail size={12} /> {tenant.email}</span>
                    </div>
                  </div>
                  {activeTenancy ? (
                    <span className="text-xs bg-success-50 text-green-700 px-2 py-1 rounded-full font-medium">
                      {activeTenancy.room?.property?.name} — {activeTenancy.room?.label}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
                      Tidak aktif
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
