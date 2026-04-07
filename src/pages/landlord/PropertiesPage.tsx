import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Plus, MapPin, ChevronRight, Users, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Property, Room } from '@/types/database'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { getPlanTier, canAddProperty } from '@/lib/feature-gates'
import { getCurrentPlanCode } from '@/lib/subscription'

interface PropertyWithRooms extends Property {
  rooms: Room[]
}

export default function PropertiesPage() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const [properties, setProperties] = useState<PropertyWithRooms[]>([])
  const [loading, setLoading] = useState(true)
  const [planCode, setPlanCode] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    loadProperties()
    getCurrentPlanCode(profile.id).then(setPlanCode)
  }, [profile])

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('*, rooms(*)')
      .eq('landlord_id', profile!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    setProperties((data as PropertyWithRooms[]) || [])
    setLoading(false)
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('properties.title')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{properties.length} {t('properties.title').toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/tenants">
            <Button size="sm" variant="ghost" icon={Users}>{t('tenants.title', 'Tenants')}</Button>
          </Link>
          {canAddProperty(getPlanTier(planCode), properties.length) ? (
            <Link to="/properties/new">
              <Button size="sm" icon={Plus}>{t('common.add')}</Button>
            </Link>
          ) : (
            <Link to="/plans">
              <Button size="sm" variant="secondary" icon={Lock}>Upgrade</Button>
            </Link>
          )}
        </div>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('dashboard.start_add_property')}
          description={t('dashboard.start_desc')}
          action={{ label: t('dashboard.add_property'), to: '/properties/new' }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {properties.map((property) => {
            const activeRooms = property.rooms.filter((r) => r.is_active)
            const occupied = activeRooms.filter((r) => r.status === 'occupied').length
            const vacant = activeRooms.length - occupied
            const occupancyPercent = activeRooms.length > 0 ? Math.round((occupied / activeRooms.length) * 100) : 0

            return (
              <Link key={property.id} to={`/properties/${property.id}`} className="block">
                <Card variant="elevated" pressable padding="p-4" className="relative overflow-hidden">
                  {/* Full-card subtle batik background — geometric pattern */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'url(/batik/batak-geometric.png)',
                      backgroundSize: '300px',
                      backgroundRepeat: 'repeat',
                      opacity: 0.04,
                      filter: 'grayscale(1)',
                      mixBlendMode: 'multiply',
                    }}
                  />

                  <div className="relative">
                    {/* Property header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                          <Building2 size={20} className="text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 truncate">{property.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin size={12} className="shrink-0" />
                            <span className="truncate">{property.address}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 shrink-0 mt-2" />
                    </div>

                    {/* Occupancy bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{t('dashboard.rooms_filled')}</span>
                        <span className="text-xs font-bold text-gray-700">{occupied}/{activeRooms.length}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats + billing */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex gap-3 text-xs">
                        <span className="text-gray-500"><strong className="text-gray-800">{activeRooms.length}</strong> rooms</span>
                        <span className="text-green-600"><strong>{occupied}</strong> filled</span>
                        {vacant > 0 && <span className="text-amber-600"><strong>{vacant}</strong> vacant</span>}
                      </div>
                      <span className="text-[10px] text-gray-400">Day {property.billing_date}</span>
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
