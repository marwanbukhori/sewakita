import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="max-w-sm mx-auto text-center py-12 animate-in">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="text-green-600" size={40} />
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('payments.success_title')}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {t('payments.success_desc')}
      </p>

      <Card variant="outlined" padding="p-4" className="mb-6 text-left">
        <p className="text-xs text-gray-500 mb-1">{t('payments.success_next')}</p>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>{t('payments.success_step1')}</li>
          <li>{t('payments.success_step2')}</li>
          <li>{t('payments.success_step3')}</li>
        </ul>
      </Card>

      <Button fullWidth size="lg" onClick={() => navigate('/tenant/dashboard')}>
        {t('payments.back_to_dashboard')}
      </Button>
    </div>
  )
}
