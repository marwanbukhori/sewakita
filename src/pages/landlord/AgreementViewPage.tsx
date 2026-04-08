import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Download, FileText, Check, Zap, Droplets, Wifi } from 'lucide-react'
import type { RentAgreement, Property, Room } from '@/types/database'
import { generateAgreementPDF } from '@/lib/agreement-pdf'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonList } from '@/components/ui/Skeleton'

const UTILITY_ICONS: Record<string, typeof Zap> = { electric: Zap, water: Droplets, internet: Wifi }
const UTILITY_LABELS: Record<string, string> = { electric: 'Electricity (TNB)', water: 'Water (SYABAS)', internet: 'Internet' }

export default function AgreementViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [agreement, setAgreement] = useState<RentAgreement | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadAgreement()
  }, [id])

  async function loadAgreement() {
    const { data } = await supabase
      .from('rent_agreements')
      .select('*')
      .eq('id', id!)
      .single()

    if (!data) { setLoading(false); return }
    setAgreement(data)

    const [{ data: prop }, { data: rm }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', data.property_id).single(),
      supabase.from('rooms').select('*').eq('id', data.room_id).single(),
    ])
    setProperty(prop)
    setRoom(rm)
    setLoading(false)
  }

  function handleDownloadPDF() {
    if (!agreement || !property || !room) return
    const doc = generateAgreementPDF(agreement, property, room)
    doc.save(`ReRumah_Agreement_${property.name}_${room.label}.pdf`)
  }

  if (loading) return <SkeletonList count={3} />
  if (!agreement || !property || !room) return <div className="text-center py-12 text-gray-500">{t('agreement.not_found')}</div>

  const statusMap: Record<string, string> = {
    draft: t('agreement.status_draft'),
    sent: t('agreement.status_sent'),
    signed: t('agreement.status_signed'),
    expired: t('agreement.status_expired'),
    terminated: t('agreement.status_terminated'),
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('agreement.title')}</h1>
          <p className="text-sm text-gray-500">{property.name} — {room.label}</p>
        </div>
        <StatusBadge
          status={agreement.status === 'signed' ? 'paid' : agreement.status === 'sent' ? 'pending' : 'ended'}
          label={statusMap[agreement.status]}
        />
      </div>

      {/* Parties */}
      <Card variant="elevated" padding="p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('agreement.parties')}</p>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">{t('agreement.landlord')}</p>
            <p className="font-semibold text-gray-800 text-sm">{agreement.landlord_name}</p>
            <p className="text-xs text-gray-500">{agreement.landlord_phone}</p>
            {agreement.landlord_signed_at && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={10} /> {t('agreement.signed')}</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">{t('agreement.tenant')}</p>
            {agreement.tenant_name ? (
              <>
                <p className="font-semibold text-gray-800 text-sm">{agreement.tenant_name}</p>
                <p className="text-xs text-gray-500">{agreement.tenant_phone}</p>
                {agreement.tenant_signed_at && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={10} /> {t('agreement.signed')}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">{t('agreement.waiting_tenant')}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Terms */}
      <Card variant="elevated" padding="p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('agreement.terms')}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-gray-500">{t('agreement.start_date')}</p><p className="font-medium text-gray-800">{agreement.start_date}</p></div>
          <div><p className="text-xs text-gray-500">{t('agreement.end_date')}</p><p className="font-medium text-gray-800">{agreement.end_date || t('agreement.monthly')}</p></div>
          <div><p className="text-xs text-gray-500">{t('agreement.rent')}</p><p className="font-medium text-gray-800">RM{agreement.rent_amount}{t('common.per_month')}</p></div>
          <div><p className="text-xs text-gray-500">{t('agreement.deposit')}</p><p className="font-medium text-gray-800">RM{agreement.deposit_amount}</p></div>
          <div><p className="text-xs text-gray-500">{t('agreement.payment_day')}</p><p className="font-medium text-gray-800">{t('agreement.day_option', { day: agreement.payment_due_day })}</p></div>
          <div><p className="text-xs text-gray-500">{t('agreement.notice_period')}</p><p className="font-medium text-gray-800">{t('agreement.days', { count: agreement.notice_period_days })}</p></div>
        </div>
      </Card>

      {/* Utilities */}
      {agreement.utilities_included && agreement.utilities_included.length > 0 && (
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('agreement.utilities_section')}</p>
          <div className="space-y-2">
            {agreement.utilities_included.map(u => {
              const Icon = UTILITY_ICONS[u.type] || FileText
              return (
                <div key={u.type} className="flex items-center gap-3">
                  <Icon size={16} className={u.included ? 'text-primary-600' : 'text-gray-400'} />
                  <span className="text-sm text-gray-700 flex-1">{UTILITY_LABELS[u.type] || u.type}</span>
                  <span className={`text-xs font-medium ${u.included ? 'text-primary-600' : 'text-gray-500'}`}>
                    {u.included ? t('agreement.included') : t('agreement.tenant_pays')}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Rules */}
      {agreement.rules && agreement.rules.length > 0 && (
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('agreement.house_rules')}</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            {agreement.rules.map((r, i) => (
              <li key={i} className="text-sm text-gray-700">{r.rule}</li>
            ))}
          </ol>
        </Card>
      )}

      {/* Additional Terms */}
      {agreement.additional_terms && (
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('agreement.additional_terms')}</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{agreement.additional_terms}</p>
        </Card>
      )}

      {/* Download PDF */}
      <Button icon={Download} fullWidth size="lg" onClick={handleDownloadPDF}>
        {t('agreement.download_pdf')}
      </Button>
    </div>
  )
}
