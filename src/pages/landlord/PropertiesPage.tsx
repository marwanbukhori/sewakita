import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Plus, MapPin, ChevronRight, ArrowLeft } from 'lucide-react'
import type { Property, Room } from '@/types/database'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'

interface PropertyWithRooms extends Property {
  rooms: Room[]
}

export default function PropertiesPage() {
  const { profile } = useAuth()
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

  const navigate = useNavigate()

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} icon={ArrowLeft} className="sm:hidden">
        Dashboard
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Hartanah</h1>
        <Link to="/properties/new">
          <Button size="sm" icon={Plus}>Tambah</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tiada hartanah lagi"
          description="Tambah hartanah pertama anda."
          action={{ label: 'Tambah Hartanah', to: '/properties/new' }}
        />
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const activeRooms = property.rooms.filter((r) => r.is_active)
            const occupied = activeRooms.filter((r) => r.status === 'occupied').length
            return (
              <Link key={property.id} to={`/properties/${property.id}`}>
                <Card variant="default" pressable padding="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800">{property.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 ml-3">
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-sm">
                    <span className="text-gray-500">
                      <strong className="text-gray-800">{activeRooms.length}</strong> bilik
                    </span>
                    <span className="text-gray-500">
                      <strong className="text-gray-800">{occupied}</strong> berisi
                    </span>
                    <span className="text-gray-500">
                      Bil: hari <strong className="text-gray-800">{property.billing_date}</strong>
                    </span>
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
