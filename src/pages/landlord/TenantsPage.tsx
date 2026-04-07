import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Users, ArrowLeft, Phone, Mail, MessageCircle, Home, Calendar, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import type { Profile, Tenancy, Room, Property } from '@/types/database'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import { SkeletonList } from '@/components/ui/Skeleton'

interface TenantWithTenancy extends Profile {
  tenancies: (Tenancy & { room: Room & { property: Property } })[]
}

export default function TenantsPage() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<TenantWithTenancy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<TenantWithTenancy | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    loadTenants()
  }, [profile])

  async function loadTenants() {
    const { data } = await supabase
      .from('profiles')
      .select('*, tenancies(*, room:rooms(*, property:properties(*)))')
      .eq('role', 'tenant')
      .order('name')

    const myTenants = (data || []).filter((t: TenantWithTenancy) =>
      t.tenancies?.some(tn => tn.room?.property?.landlord_id === profile!.id)
    )

    setTenants(myTenants)
    setLoading(false)
  }

  function openTenant(tenant: TenantWithTenancy) {
    setSelectedTenant(tenant)
    setEditForm({ name: tenant.name, phone: tenant.phone, email: tenant.email })
    setEditing(false)
  }

  async function handleSave() {
    if (!selectedTenant) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name: editForm.name,
      phone: editForm.phone,
    }).eq('id', selectedTenant.id)
    setSaving(false)
    if (error) { toast.error('Failed to update'); return }
    toast.success('Updated!')
    setEditing(false)
    setSelectedTenant(null)
    loadTenants()
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t('tenants.title')}</h1>
            <p className="text-xs text-gray-500">{tenants.length} {t('tenants.title').toLowerCase()}</p>
          </div>
        </div>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon={Users} title={t('tenants.no_tenants')} />
      ) : (
        <div className="space-y-2">
          {tenants.map(tenant => {
            const activeTenancy = tenant.tenancies?.find(t => t.status === 'active')
            const phone = tenant.phone?.replace(/[^0-9]/g, '').replace(/^0/, '60')

            return (
              <button
                key={tenant.id}
                onClick={() => openTenant(tenant)}
                className="w-full flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {tenant.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{tenant.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {tenant.phone}
                    {activeTenancy && ` · ${activeTenancy.room?.property?.name}`}
                  </p>
                </div>
                {activeTenancy ? (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                    {activeTenancy.room?.label}
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                    {t('tenants.inactive', 'Inactive')}
                  </span>
                )}
                <span className="text-gray-300">›</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Tenant detail modal */}
      <BottomSheet
        open={!!selectedTenant}
        onClose={() => { setSelectedTenant(null); setEditing(false) }}
        title={selectedTenant?.name || ''}
      >
        {selectedTenant && (
          <div className="space-y-4">
            {!editing ? (
              <>
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0">
                    {selectedTenant.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-gray-800">{selectedTenant.name}</p>
                    {selectedTenant.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} /> {selectedTenant.phone}</p>
                    )}
                    {selectedTenant.email && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 truncate"><Mail size={12} /> {selectedTenant.email}</p>
                    )}
                  </div>
                  <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Tenancy info */}
                {selectedTenant.tenancies?.filter(t => t.status === 'active').map(tn => (
                  <div key={tn.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Home size={14} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-800">{tn.room?.property?.name} · {tn.room?.label}</span>
                      <StatusBadge status="active" label="Active" />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(tn.move_in), 'dd MMM yyyy')}</span>
                      <span>RM{tn.agreed_rent}/bln</span>
                      <span>Deposit: RM{tn.deposit}</span>
                    </div>
                  </div>
                ))}

                {/* Past tenancies */}
                {selectedTenant.tenancies?.filter(t => t.status === 'ended').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Past</p>
                    {selectedTenant.tenancies.filter(t => t.status === 'ended').map(tn => (
                      <div key={tn.id} className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-1 flex justify-between">
                        <span>{tn.room?.property?.name} · {tn.room?.label}</span>
                        <span>{tn.move_in} → {tn.move_out || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick actions */}
                {selectedTenant.phone && (
                  <a
                    href={`https://wa.me/${selectedTenant.phone.replace(/[^0-9]/g, '').replace(/^0/, '60')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}
              </>
            ) : (
              <>
                {/* Edit form */}
                <Input label={t('properties.name', 'Name')} value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <Input label={t('properties.phone', 'Phone')} value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                <Input label="Email" value={editForm.email} disabled
                  helperText="Email cannot be changed" />
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button className="flex-1" loading={saving} onClick={handleSave}>
                    {t('common.save')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
