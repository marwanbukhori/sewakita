import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, History } from 'lucide-react'
import type { Property, Room, Tenancy, Profile, Invite } from '@/types/database'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'

interface RoomWithTenancy extends Room {
  tenancies: (Tenancy & { tenant: Profile })[]
}

interface RoomDetailSheetProps {
  open: boolean
  onClose: () => void
  room: RoomWithTenancy | null
  property: Property | null
  pendingInvites: Invite[]
  onRefresh: () => void
}

export default function RoomDetailSheet({ open, onClose, room, property, pendingInvites, onRefresh }: RoomDetailSheetProps) {
  const { t } = useTranslation()
  const [showPast, setShowPast] = useState(false)

  if (!room || !property) return null

  const activeTenancy = room.tenancies?.find(t => t.status === 'active')
  const tenant = activeTenancy?.tenant
  const pastTenancies = room.tenancies?.filter(t => t.status === 'ended') || []
  const roomInvites = pendingInvites.filter(inv => inv.room_id === room.id)
  const isOccupied = room.status === 'occupied' && tenant

  async function handleRevokeInvite(inviteId: string) {
    const { error } = await supabase.from('invites').update({ status: 'revoked' }).eq('id', inviteId)
    if (error) { toast.error(t('properties.failed_revoke_invite')); return }
    toast.success(t('properties.invite_revoked'))
    onRefresh()
  }

  const phone = tenant?.phone?.replace(/[^0-9]/g, '').replace(/^0/, '60')

  const actions = isOccupied ? [
    { emoji: '📋', label: t('properties.view_bills', 'Lihat Bil'), desc: t('properties.view_bills_desc', 'Bil bulanan penyewa ini'), to: '/bil', destructive: false },
    { emoji: '📄', label: t('properties.agreement', 'Perjanjian Sewa'), desc: t('properties.agreement_desc', 'Lihat atau buat perjanjian'), to: `/agreements/new?room_id=${room.id}&property_id=${property.id}`, destructive: false },
    { emoji: '💬', label: 'WhatsApp', desc: t('properties.contact_tenant', 'Hubungi penyewa'), to: phone ? `https://wa.me/${phone}` : '#', destructive: false, external: true },
    { emoji: '🚪', label: t('properties.move_out', 'Pindah Keluar'), desc: t('properties.move_out_desc', 'Proses pindah keluar'), to: `/properties/${property.id}/rooms/${room.id}/move-out`, destructive: true },
  ] : []

  return (
    <BottomSheet open={open} onClose={onClose} title={`${room.label} · RM${room.rent_amount}/bln`}>
      <div className="space-y-4">
        {isOccupied ? (
          <>
            {/* Tenant profile */}
            <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold shrink-0">
                {tenant.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{tenant.name}</p>
                {tenant.phone && <p className="text-xs text-gray-500">📱 {tenant.phone}</p>}
                {tenant.email && <p className="text-xs text-gray-500 truncate">✉ {tenant.email}</p>}
              </div>
            </div>

            {/* Key info strip */}
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-medium">{t('properties.move_in_date', 'Masuk')}</p>
                <p className="text-sm font-bold text-gray-800">{format(new Date(activeTenancy!.move_in), 'dd MMM yyyy')}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-medium">{t('properties.rent', 'Sewa')}</p>
                <p className="text-sm font-bold text-gray-800">RM{activeTenancy!.agreed_rent}/bln</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-medium">{t('properties.deposit', 'Deposit')}</p>
                <p className="text-sm font-bold text-gray-800">RM{activeTenancy!.deposit}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {actions.map(action => {
                const content = (
                  <div className={`flex items-center gap-3 bg-white rounded-xl p-3.5 border transition-colors hover:bg-gray-50 ${action.destructive ? 'border-red-100' : 'border-gray-100'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${action.destructive ? 'bg-red-50' : 'bg-primary-50'}`}>
                      <span className="text-base">{action.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${action.destructive ? 'text-red-600' : 'text-gray-800'}`}>{action.label}</p>
                      <p className="text-[11px] text-gray-400">{action.desc}</p>
                    </div>
                    <span className="text-gray-300">›</span>
                  </div>
                )
                if (action.external) {
                  return <a key={action.label} href={action.to} target="_blank" rel="noopener noreferrer">{content}</a>
                }
                return <Link key={action.label} to={action.to}>{content}</Link>
              })}
            </div>

            {/* Past tenants */}
            {pastTenancies.length > 0 && (
              <div>
                <button onClick={() => setShowPast(!showPast)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <History size={10} /> {t('properties.past_tenants', { count: pastTenancies.length })}
                  {showPast ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                {showPast && (
                  <div className="mt-2 space-y-1.5">
                    {pastTenancies.map(pt => (
                      <div key={pt.id} className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 flex justify-between">
                        <span>{pt.tenant?.name || 'Unknown'}</span>
                        <span>{pt.move_in} → {pt.move_out || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Vacant state */}
            {roomInvites.length > 0 && (
              <div className="space-y-2">
                {roomInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <span className="text-base">⏳</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-700">{t('properties.invite_pending')}</p>
                      <p className="text-[11px] text-amber-600 truncate">{inv.email || t('properties.no_email')} · {t('properties.expires', { date: format(new Date(inv.expires_at), 'dd MMM') })}</p>
                    </div>
                    <button onClick={() => handleRevokeInvite(inv.id)} className="text-xs text-amber-600 bg-white px-2 py-1 rounded-lg hover:bg-amber-50">
                      {t('common.cancel', 'Batal')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <span className="text-4xl block mb-3">🏠</span>
              <p className="text-sm font-semibold text-gray-700">{t('properties.room_vacant_title', 'Bilik ini kosong')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('properties.room_vacant_desc', 'Jemput penyewa baru untuk mengisi bilik ini.')}</p>
            </div>

            <Link to={`/tenants/new?room_id=${room.id}&property_id=${property.id}`}>
              <Button fullWidth>{t('properties.invite_tenant')}</Button>
            </Link>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
