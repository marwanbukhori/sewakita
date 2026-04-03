import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Users, Plus, Phone, Mail } from 'lucide-react'
import type { Profile, Tenancy, Room, Property } from '@/types/database'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'

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
      .select(`*, tenancies(*, room:rooms(*, property:properties(*)))`)
      .eq('role', 'tenant')
      .order('name')

    const myTenants = (data || []).filter((t: TenantWithTenancy) =>
      t.tenancies?.some((tn) => tn.room?.property?.landlord_id === profile!.id)
    )

    setTenants(myTenants)
    setLoading(false)
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Penyewa</h1>
        <Link to="/tenants/new">
          <Button size="sm" icon={Plus}>Tambah</Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon={Users} title="Tiada penyewa lagi" />
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => {
            const activeTenancy = tenant.tenancies?.find((t) => t.status === 'active')
            return (
              <Link key={tenant.id} to={`/tenants/${tenant.id}`}>
                <Card variant="default" pressable padding="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {tenant.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800">{tenant.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Phone size={11} /> {tenant.phone}</span>
                        <span className="flex items-center gap-1 truncate"><Mail size={11} /> {tenant.email}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {activeTenancy ? (
                        <StatusBadge status="active" label={`${activeTenancy.room?.property?.name}`} />
                      ) : (
                        <StatusBadge status="ended" label="Tidak aktif" />
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
