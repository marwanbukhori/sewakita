import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Check, AlertCircle, ChevronRight, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Property } from '@/types/database'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import SectionHeader from '@/components/ui/SectionHeader'
import { SkeletonList } from '@/components/ui/Skeleton'
import {
  getActiveSubscription,
  formatPeriodRemaining,
  type SubscriptionWithPlan,
} from '@/lib/subscription'

interface PaymentSettings {
  property_id: string
  gateway_category_code: string | null
  gateway_secret_key_encrypted: string | null
}

export default function PaymentSettingsPage() {
  const { profile } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [categoryCode, setCategoryCode] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [existingKeyMasked, setExistingKeyMasked] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!profile) return
    load()
  }, [profile])

  useEffect(() => {
    if (!selectedPropertyId) return
    loadSettingsForProperty(selectedPropertyId)
  }, [selectedPropertyId])

  async function load() {
    const [sub, { data: props }] = await Promise.all([
      getActiveSubscription(profile!.id),
      supabase.from('properties').select('*').eq('landlord_id', profile!.id).eq('is_active', true).order('name'),
    ])
    setSubscription(sub)
    setProperties(props || [])
    if (props && props.length > 0) setSelectedPropertyId(props[0].id)
    setLoading(false)
  }

  async function loadSettingsForProperty(propertyId: string) {
    const { data } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle()
    if (data) {
      setCategoryCode(data.gateway_category_code || '')
      setSecretKey('')
      setExistingKeyMasked(data.gateway_secret_key_encrypted ? maskKey(atob(data.gateway_secret_key_encrypted)) : null)
    } else {
      setCategoryCode('')
      setSecretKey('')
      setExistingKeyMasked(null)
    }
  }

  function maskKey(key: string): string {
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '••••' + key.slice(-4)
  }

  async function handleVerify() {
    if (!categoryCode || !secretKey) {
      toast.error('Enter both category code and secret key first')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-toyyibpay-creds`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret_key: secretKey, category_code: categoryCode }),
        }
      )
      const data = await res.json()
      if (data.valid) {
        toast.success('Credentials verified ✓')
      } else {
        toast.error(`Invalid: ${data.error || 'credentials rejected'}`)
      }
    } catch {
      toast.error('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  async function handleSave() {
    if (!selectedPropertyId) return
    if (!categoryCode) {
      toast.error('Category code is required')
      return
    }
    setSaving(true)
    try {
      const payload: Partial<PaymentSettings> = {
        property_id: selectedPropertyId,
        gateway_category_code: categoryCode,
      }
      if (secretKey) {
        // base64-encode for storage (upgrade to pgsodium later)
        ;(payload as Record<string, string>).gateway_secret_key_encrypted = btoa(secretKey)
      }

      const { error } = await supabase
        .from('payment_settings')
        .upsert(payload, { onConflict: 'property_id' })

      if (error) throw error
      toast.success('Payment settings saved')
      loadSettingsForProperty(selectedPropertyId)
    } catch (e) {
      toast.error((e as Error).message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-5 animate-in pb-8">
      <h1 className="text-xl font-bold text-gray-800">Payment Settings</h1>

      {/* Your subscription */}
      <div>
        <SectionHeader title="Your subscription" />
        <Link to="/plans">
          <Card variant="outlined" padding="p-4" pressable>
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-primary-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {subscription?.plan.display_name || 'No subscription'}
                </p>
                {subscription && (
                  <p className="text-xs text-gray-500">{formatPeriodRemaining(subscription.period_end)}</p>
                )}
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Rent collection setup */}
      <div>
        <SectionHeader title="Rent collection (ToyyibPay)" />
        <Card variant="outlined" padding="p-4" className="space-y-4">
          {properties.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle size={16} />
              Add a property first
            </div>
          ) : (
            <>
              <Select
                label="Property"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>

              <Input
                label="Category Code"
                type="text"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                placeholder="e.g. abc12def"
              />

              <Input
                label={`User Secret Key${existingKeyMasked ? ` (saved: ${existingKeyMasked})` : ''}`}
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={existingKeyMasked ? 'Leave blank to keep existing key' : 'Enter ToyyibPay secret key'}
              />

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" loading={verifying} onClick={handleVerify} disabled={!categoryCode || !secretKey}>
                  Verify
                </Button>
                <Button size="sm" loading={saving} onClick={handleSave} className="flex-1">
                  {existingKeyMasked ? 'Update' : 'Save'}
                </Button>
              </div>

              <a
                href="https://toyyibpay.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700"
              >
                <ExternalLink size={12} />
                Don't have a ToyyibPay account yet? Sign up free
              </a>

              {existingKeyMasked && categoryCode && (
                <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded">
                  <Check size={12} /> Tenants can now pay rent online via FPX/card
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
