import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Plus, MapPin, ChevronRight } from 'lucide-react'
import type { Property, Room } from '@/types/database'

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

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Hartanah</h1>
        <Link
          to="/properties/new"
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Tambah
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Building2 className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">Tiada hartanah lagi. Tambah hartanah pertama anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const activeRooms = property.rooms.filter((r) => r.is_active)
            const occupied = activeRooms.filter((r) => r.status === 'occupied').length
            return (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{property.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin size={14} />
                      {property.address}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-gray-500">
                    <strong className="text-gray-900">{activeRooms.length}</strong> bilik
                  </span>
                  <span className="text-gray-500">
                    <strong className="text-gray-900">{occupied}</strong> berisi
                  </span>
                  <span className="text-gray-500">
                    Bil: hari <strong className="text-gray-900">{property.billing_date}</strong>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
