import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'

export default function PropertyFormPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    address: '',
    billing_date: 1,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    const { error } = await supabase.from('properties').insert({
      landlord_id: profile.id,
      name: form.name,
      address: form.address,
      billing_date: form.billing_date,
      is_active: true,
    })
    setLoading(false)

    if (error) {
      toast.error(t('properties.add_error'))
      return
    }

    toast.success(t('properties.add_success'))
    navigate('/properties')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <h1 className="text-xl font-bold text-gray-800">{t('properties.add')}</h1>

      <Card variant="elevated" padding="p-6" className="!rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('properties.name')}
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('properties.placeholder_name')}
          />
          <Input
            label={t('properties.address')}
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder={t('properties.placeholder_address')}
          />
          <Select
            label={t('properties.billing_date')}
            value={form.billing_date}
            onChange={(e) => setForm({ ...form, billing_date: Number(e.target.value) })}
            helperText={t('properties.billing_helper')}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{t('properties.day', { day: d })}</option>
            ))}
          </Select>

          <Button type="submit" loading={loading} fullWidth size="lg">
            {t('properties.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
