import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, Bell, Mail, MessageCircle } from 'lucide-react'
import type { Property } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useConfig } from '@/lib/config'

interface NotificationSettings {
  email_enabled: boolean
  whatsapp_enabled: boolean
  on_bill_generated: boolean
  on_payment_received: boolean
  on_overdue: number | null
  on_agreement_ready: boolean
  reply_to_email: string
}

export default function NotificationSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { config: configData } = useConfig()
  const [property, setProperty] = useState<Property | null>(null)
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    whatsapp_enabled: true,
    on_bill_generated: true,
    on_payment_received: true,
    on_overdue: 3,
    on_agreement_ready: true,
    reply_to_email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) loadSettings()
  }, [id])

  async function loadSettings() {
    const [{ data: prop }, { data: existing }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', id!).single(),
      supabase.from('notification_settings').select('*').eq('property_id', id!).single(),
    ])
    setProperty(prop)
    if (existing) {
      setSettings({
        email_enabled: existing.email_enabled,
        whatsapp_enabled: existing.whatsapp_enabled,
        on_bill_generated: existing.on_bill_generated,
        on_payment_received: existing.on_payment_received,
        on_overdue: existing.on_overdue,
        on_agreement_ready: existing.on_agreement_ready,
        reply_to_email: existing.reply_to_email || '',
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('notification_settings').upsert({
      property_id: id!,
      ...settings,
      reply_to_email: settings.reply_to_email || null,
    }, { onConflict: 'property_id' })

    setSaving(false)
    if (error) { toast.error('Failed to save'); return }
    toast.success('Notification settings saved!')
  }

  if (loading) return null

  function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
    return (
      <button onClick={() => onChange(!checked)} className="w-full flex items-center gap-3 py-3 text-left">
        <div className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'left-5' : 'left-1'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {desc && <p className="text-xs text-gray-500">{desc}</p>}
        </div>
      </button>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div className="flex items-center gap-3">
        <Bell size={20} className="text-primary-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notification Settings</h1>
          <p className="text-sm text-gray-500">{property?.name}</p>
        </div>
      </div>

      {/* Channels */}
      <Card variant="elevated" padding="p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Channels</p>
        <div className="divide-y divide-gray-100">
          <Toggle
            checked={settings.email_enabled}
            onChange={(v) => setSettings({ ...settings, email_enabled: v })}
            label="Email (automated)"
            desc="Send bills, receipts, and reminders via email"
          />
          <Toggle
            checked={settings.whatsapp_enabled}
            onChange={(v) => setSettings({ ...settings, whatsapp_enabled: v })}
            label="WhatsApp (manual)"
            desc="Show WhatsApp send buttons on bills"
          />
        </div>
      </Card>

      {/* Triggers */}
      <Card variant="elevated" padding="p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Triggers</p>
        <div className="divide-y divide-gray-100">
          <Toggle
            checked={settings.on_bill_generated}
            onChange={(v) => setSettings({ ...settings, on_bill_generated: v })}
            label="Bill generated"
            desc="Notify tenant when monthly bill is created"
          />
          <Toggle
            checked={settings.on_payment_received}
            onChange={(v) => setSettings({ ...settings, on_payment_received: v })}
            label="Payment received"
            desc="Send receipt to tenant after payment"
          />
          <Toggle
            checked={settings.on_agreement_ready}
            onChange={(v) => setSettings({ ...settings, on_agreement_ready: v })}
            label="Agreement ready"
            desc="Notify when rental agreement needs signing"
          />
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Overdue reminder</p>
                <p className="text-xs text-gray-500">Days after due date to send reminder</p>
              </div>
              <select
                value={settings.on_overdue ?? ''}
                onChange={(e) => setSettings({ ...settings, on_overdue: e.target.value ? Number(e.target.value) : null })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Disabled</option>
                {((configData.overdue_reminder_intervals as number[]) || [1, 3, 5, 7]).map(d => (
                  <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Email settings */}
      {settings.email_enabled && (
        <Card variant="elevated" padding="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Email Settings</p>
          <Input
            label="Reply-to email"
            type="email"
            value={settings.reply_to_email}
            onChange={(e) => setSettings({ ...settings, reply_to_email: e.target.value })}
            helperText="Tenants will reply to this email address"
          />
        </Card>
      )}

      <Button fullWidth size="lg" loading={saving} onClick={handleSave}>
        {t('common.save')} Settings
      </Button>
    </div>
  )
}
