import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Plus, MapPin, ChevronRight, Home, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Property, Room } from '@/types/database'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { BatikCardAccent } from '@/assets/batik/patterns'

interface PropertyWithRooms extends Property {
  rooms: Room[]
}

export default function PropertiesPage() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const [properties, setProperties] = useState<PropertyWithRooms[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadProperties()
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
        <Link to="/properties/new">
          <Button size="sm" icon={Plus}>{t('common.add')}</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('dashboard.start_add_property')}
          description={t('dashboard.start_desc')}
          action={{ label: t('dashboard.add_property'), to: '/properties/new' }}
        />
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const activeRooms = property.rooms.filter((r) => r.is_active)
            const occupied = activeRooms.filter((r) => r.status === 'occupied').length
            const vacant = activeRooms.length - occupied
            const occupancyPercent = activeRooms.length > 0 ? Math.round((occupied / activeRooms.length) * 100) : 0

            return (
              <Link key={property.id} to={`/properties/${property.id}`}>
                <Card variant="elevated" pressable padding="p-0" className="overflow-hidden relative">
                  <BatikCardAccent />

                  <div className="p-4">
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

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-primary-50 rounded-lg p-2 text-center">
                        <Home size={14} className="text-primary-600 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">{activeRooms.length}</p>
                        <p className="text-[10px] text-gray-500">{t('properties.rooms')}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <Users size={14} className="text-green-600 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">{occupied}</p>
                        <p className="text-[10px] text-gray-500">Occupied</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 text-center">
                        <Home size={14} className="text-amber-600 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">{vacant}</p>
                        <p className="text-[10px] text-gray-500">Vacant</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom strip */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{t('properties.billing_day', { day: property.billing_date })}</span>
                    <span className="text-[10px] text-primary-600 font-semibold">{t('properties.edit')} →</span>
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
