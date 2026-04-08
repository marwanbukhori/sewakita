import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, Copy, MessageCircle, Check, Link as LinkIcon, ChevronDown, ChevronUp, Plus, X, Zap, Droplets, Wifi, FileText } from 'lucide-react'
import type { Property, Room, UtilityType } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'

const SUGGESTED_RULE_KEYS = [
  'agreement.rule_no_smoking', 'agreement.rule_no_pets', 'agreement.rule_quiet_hours',
  'agreement.rule_no_sublet', 'agreement.rule_keep_clean', 'agreement.rule_no_illegal',
]

const UTILITY_OPTIONS: { type: UtilityType; icon: typeof Zap }[] = [
  { type: 'electric', icon: Zap },
  { type: 'water', icon: Droplets },
  { type: 'internet', icon: Wifi },
]

export default function TenantFormPage() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedRoomId = searchParams.get('room_id')
  const preselectedPropertyId = searchParams.get('property_id')

  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<(Property & { rooms: Room[] })[]>([])
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Agreement toggle
  const [includeAgreement, setIncludeAgreement] = useState(false)
  const [agreementExpanded, setAgreementExpanded] = useState(false)

  const [form, setForm] = useState({
    property_id: preselectedPropertyId || '',
    room_id: preselectedRoomId || '',
    email: '',
    agreed_rent: '',
    deposit: '',
    move_in: new Date().toISOString().split('T')[0],
    // Agreement fields
    end_date: '',
    payment_due_day: 1,
    notice_period_days: 30,
    utilities: UTILITY_OPTIONS.map(u => ({ type: u.type, included: false })),
    rules: [] as string[],
    customRule: '',
    additional_terms: '',
  })

  useEffect(() => {
    if (!profile) return
    loadProperties()
  }, [profile])

  async function loadProperties() {
    const { data } = await supabase
      .from('properties').select('*, rooms(*)').eq('landlord_id', profile!.id).eq('is_active', true)
    setProperties(data || [])
    if (preselectedRoomId && data) {
      for (const prop of data) {
        const room = prop.rooms?.find((r: Room) => r.id === preselectedRoomId)
        if (room) { setForm((f) => ({ ...f, agreed_rent: String(room.rent_amount) })); break }
      }
    }
  }

  const vacantRooms = properties.find((p) => p.id === form.property_id)
    ?.rooms?.filter((r: Room) => r.status === 'vacant' && r.is_active) || []

  function toggleRule(rule: string) {
    setForm(f => ({ ...f, rules: f.rules.includes(rule) ? f.rules.filter(r => r !== rule) : [...f.rules, rule] }))
  }

  function addCustomRule() {
    if (!form.customRule.trim()) return
    setForm(f => ({ ...f, rules: [...f.rules, f.customRule.trim()], customRule: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)

    let agreementId: string | null = null

    // Create agreement first if included
    if (includeAgreement) {
      const { data: agr, error: agrErr } = await supabase.from('rent_agreements').insert({
        property_id: form.property_id,
        room_id: form.room_id,
        landlord_id: profile.id,
        start_date: form.move_in,
        end_date: form.end_date || null,
        rent_amount: Number(form.agreed_rent),
        deposit_amount: Number(form.deposit),
        payment_due_day: form.payment_due_day,
        notice_period_days: form.notice_period_days,
        utilities_included: form.utilities,
        rules: form.rules.map(rule => ({ rule })),
        additional_terms: form.additional_terms || null,
        landlord_name: profile.name,
        landlord_phone: profile.phone,
        landlord_signed_at: new Date().toISOString(),
        status: 'sent',
      }).select().single()

      if (agrErr || !agr) {
        toast.error(t('agreement.failed_create'))
        setLoading(false)
        return
      }
      agreementId = agr.id
    }

    // Create invite
    const { data, error } = await supabase.from('invites').insert({
      property_id: form.property_id,
      room_id: form.room_id,
      landlord_id: profile.id,
      email: form.email || null,
      agreed_rent: Number(form.agreed_rent),
      deposit: Number(form.deposit),
      move_in: form.move_in,
      status: 'pending',
      agreement_id: agreementId,
    }).select().single()

    setLoading(false)

    if (error || !data) {
      toast.error(t('tenants.failed_create'))
      return
    }

    const link = `${window.location.origin}/invite/${data.token}`
    setInviteLink(link)
    toast.success(t('tenants.invite_success'))
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success(t('tenants.copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsAppShare() {
    if (!inviteLink) return
    const room = vacantRooms.find((r) => r.id === form.room_id)
    const property = properties.find((p) => p.id === form.property_id)
    const message = `Assalamualaikum,\n\n${t('landing.hero_subtitle')}\n\n*${property?.name}* (${room?.label})\nRM${form.agreed_rent}/month | Deposit: RM${form.deposit}\n\n${inviteLink}\n\n— ReRumah`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  // Success screen
  if (inviteLink) {
    const room = vacantRooms.find((r) => r.id === form.room_id)
    const property = properties.find((p) => p.id === form.property_id)

    return (
      <div className="space-y-4 animate-in">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">{t('tenants.invite_created')}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {t('tenants.share_link')} {property?.name} — {room?.label}
          </p>
        </div>

        <Card variant="elevated" padding="p-5">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 mb-4">
            <LinkIcon size={16} className="text-gray-400 shrink-0" />
            <p className="text-xs text-gray-600 truncate flex-1">{inviteLink}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button icon={copied ? Check : Copy} variant="secondary" onClick={handleCopy} fullWidth>
              {copied ? t('tenants.copied') : t('tenants.copy_link')}
            </Button>
            <Button icon={MessageCircle} className="!bg-green-600 hover:!bg-green-700" onClick={handleWhatsAppShare} fullWidth>
              WhatsApp
            </Button>
          </div>
        </Card>

        <Card variant="outlined" padding="p-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">{t('tenants.invite_details')}</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{t('tenants.property')}</span><span className="font-medium text-gray-800">{property?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('tenants.room')}</span><span className="font-medium text-gray-800">{room?.label}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('tenants.rent')}</span><span className="font-medium text-gray-800">RM{form.agreed_rent}{t('common.per_month')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('tenants.deposit')}</span><span className="font-medium text-gray-800">RM{form.deposit}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('tenants.move_in')}</span><span className="font-medium text-gray-800">{form.move_in}</span></div>
            {includeAgreement && (
              <div className="flex justify-between"><span className="text-gray-500">{t('agreement.title')}</span><span className="font-medium text-green-600 flex items-center gap-1"><Check size={12} /> {t('agreement.included')}</span></div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">{t('tenants.expires_in')}</p>
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => { setInviteLink(null); setForm({ ...form, room_id: '', email: '' }) }}>
            {t('tenants.invite_again')}
          </Button>
          <Button fullWidth onClick={() => navigate('/tenants')}>
            {t('tenants.done')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <h1 className="text-xl font-bold text-gray-800">{t('tenants.invite')}</h1>
      <p className="text-sm text-gray-500">{t('tenants.invite_desc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invite details */}
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">{t('agreement.tenancy_details')}</p>
          <div className="space-y-4">
            <Select label={`${t('tenants.property')} *`} required value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value, room_id: '' })}>
              <option value="">{t('tenants.select_property')}</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select label={`${t('tenants.room')} *`} required value={form.room_id}
              onChange={(e) => {
                const room = vacantRooms.find((r) => r.id === e.target.value)
                setForm({ ...form, room_id: e.target.value, agreed_rent: room ? String(room.rent_amount) : form.agreed_rent })
              }}>
              <option value="">{t('tenants.select_room')}</option>
              {vacantRooms.map((r) => <option key={r.id} value={r.id}>{r.label} (RM{r.rent_amount})</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label={`${t('tenants.rent')} (RM) *`} type="number" required value={form.agreed_rent}
                onChange={(e) => setForm({ ...form, agreed_rent: e.target.value })} />
              <Input label={`${t('tenants.deposit')} (RM) *`} type="number" required value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
            </div>
            <Input label={`${t('tenants.move_in')} *`} type="date" required value={form.move_in}
              onChange={(e) => setForm({ ...form, move_in: e.target.value })} />
            <Input label={t('tenants.tenant_email')} type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              helperText={t('tenants.email_helper')} />
          </div>
        </Card>

        {/* Agreement toggle */}
        <Card variant={includeAgreement ? 'outlined' : 'default'} padding="p-0"
          className={includeAgreement ? '!border-primary-300 !bg-primary-50/30' : ''}>
          <button type="button" onClick={() => { setIncludeAgreement(!includeAgreement); setAgreementExpanded(!includeAgreement) }}
            className="w-full flex items-center gap-3 px-5 py-4 text-left">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${includeAgreement ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
              {includeAgreement && <Check size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={16} className="text-primary-600" />
                {t('agreement.title')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{t('agreement.desc')}</p>
            </div>
            {includeAgreement && (
              agreementExpanded
                ? <ChevronUp size={18} className="text-gray-400" />
                : <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>

          {/* Inline agreement form */}
          {includeAgreement && agreementExpanded && (
            <div className="px-5 pb-5 space-y-4 border-t border-primary-200 pt-4 animate-in">
              {/* End date + payment day */}
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('agreement.end_date')} type="date" value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  helperText={t('agreement.end_date_helper')} />
                <Select label={t('agreement.payment_day')} value={form.payment_due_day}
                  onChange={(e) => setForm({ ...form, payment_due_day: Number(e.target.value) })}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d =>
                    <option key={d} value={d}>{t('agreement.day_option', { day: d })}</option>
                  )}
                </Select>
              </div>

              {/* Utilities */}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('agreement.utilities_section')}</p>
              <div className="space-y-2">
                {UTILITY_OPTIONS.map(opt => {
                  const util = form.utilities.find(u => u.type === opt.type)
                  const label = opt.type === 'electric' ? t('billing.electricity') : opt.type === 'water' ? t('billing.water') : t('billing.internet')
                  return (
                    <button key={opt.type} type="button"
                      onClick={() => setForm(f => ({ ...f, utilities: f.utilities.map(u => u.type === opt.type ? { ...u, included: !u.included } : u) }))}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-sm transition-colors ${util?.included ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}`}>
                      <opt.icon size={16} className={util?.included ? 'text-primary-600' : 'text-gray-400'} />
                      <span className="flex-1 text-left">{label}</span>
                      <span className={`text-xs font-medium ${util?.included ? 'text-primary-600' : 'text-gray-400'}`}>
                        {util?.included ? t('agreement.included') : t('agreement.tenant_pays')}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Rules */}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('agreement.house_rules')}</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_RULE_KEYS.map(key => (
                  <button key={key} type="button" onClick={() => toggleRule(t(key))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      form.rules.includes(t(key)) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {t(key)}
                  </button>
                ))}
              </div>
              {form.rules.length > 0 && (
                <div className="space-y-1">
                  {form.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 text-xs">
                      <span className="text-gray-500 w-4">{i + 1}.</span>
                      <span className="flex-1 text-gray-700">{rule}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, rules: f.rules.filter(r => r !== rule) }))} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder={t('agreement.add_custom_rule')} value={form.customRule}
                  onChange={(e) => setForm({ ...form, customRule: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomRule() } }} />
                <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addCustomRule}>{t('common.add')}</Button>
              </div>

              {/* Additional terms */}
              <textarea value={form.additional_terms}
                onChange={(e) => setForm({ ...form, additional_terms: e.target.value })}
                placeholder={t('agreement.additional_placeholder')}
                className="w-full h-20 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
            </div>
          )}
        </Card>

        <Button type="submit" loading={loading} fullWidth size="lg">
          {includeAgreement ? t('tenants.create_invite') + ' + ' + t('agreement.title') : t('tenants.create_invite')}
        </Button>
      </form>
    </div>
  )
}
