import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, Flag } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'

type Category = 'bug' | 'feature' | 'billing_issue' | 'other'

export default function ReportPage() {
  const { profile, role } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    category: 'bug' as Category,
    subject: '',
    description: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            to: 'marwanbukhori.dev@gmail.com',
            template: 'report',
            data: {
              user_name: profile.name,
              user_email: profile.email,
              user_role: role,
              category: form.category,
              subject: form.subject,
              description: form.description,
              timestamp: new Date().toISOString(),
            },
            language: 'en',
            tenant_id: profile.id,
            property_id: profile.id, // not property-specific
          }),
        }
      )

      if (response.ok) {
        setSubmitted(true)
      } else {
        toast.error(t('report.failed'))
      }
    } catch {
      toast.error(t('report.failed'))
    }

    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="max-w-sm mx-auto text-center py-12 animate-in">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('report.success_title')}</h1>
        <p className="text-sm text-gray-500 mb-8">{t('report.success_desc')}</p>
        <Button fullWidth size="lg" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Flag size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('report.title')}</h1>
        </div>
      </div>

      <Card variant="elevated" padding="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t('report.category')} value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
            <option value="bug">{t('report.bug')}</option>
            <option value="feature">{t('report.feature')}</option>
            <option value="billing_issue">{t('report.billing_issue')}</option>
            <option value="other">{t('report.other')}</option>
          </Select>

          <Input label={t('report.subject')} required value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder={t('report.subject_placeholder')} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('report.description')}</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('report.description_placeholder')}
              className="w-full h-32 px-3 py-2 text-base bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            {t('report.submit')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
