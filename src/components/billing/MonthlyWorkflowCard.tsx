import { Receipt, Send, Eye, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type WorkflowStep = 'not-started' | 'utilities-entered' | 'ready-to-send' | 'collecting'

interface WorkflowStats {
  utilitiesEntered: number
  billsGenerated: number
  billsPaid: number
  totalBills: number
}

interface MonthlyWorkflowCardProps {
  month: string
  stats: WorkflowStats
  onEnterUtilities: () => void
  onPreviewGenerate: () => void
  onViewBills: () => void
  onSendReminders: () => void
}

function getStep(stats: WorkflowStats): WorkflowStep {
  if (stats.totalBills === 0 && stats.utilitiesEntered === 0) return 'not-started'
  if (stats.totalBills === 0 && stats.utilitiesEntered > 0) return 'utilities-entered'
  if (stats.totalBills > 0 && stats.billsPaid === 0) return 'ready-to-send'
  return 'collecting'
}

function StepIndicator({ step }: { step: WorkflowStep }) {
  const steps: WorkflowStep[] = ['not-started', 'utilities-entered', 'ready-to-send', 'collecting']
  const currentIdx = steps.indexOf(step)

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full transition-colors ${
            i <= currentIdx ? 'bg-primary-600' : 'bg-gray-200'
          }`} />
          {i < steps.length - 1 && (
            <div className={`w-4 h-0.5 rounded-full transition-colors ${
              i < currentIdx ? 'bg-primary-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MonthlyWorkflowCard({
  month,
  stats,
  onEnterUtilities,
  onPreviewGenerate,
  onViewBills,
  onSendReminders,
}: MonthlyWorkflowCardProps) {
  const { t } = useTranslation()
  const step = getStep(stats)

  const monthLabel = new Date(month + '-01').toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })
  const unpaid = stats.totalBills - stats.billsPaid
  const collectionPct = stats.totalBills > 0 ? Math.round((stats.billsPaid / stats.totalBills) * 100) : 0

  return (
    <Card variant="elevated" padding="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">{monthLabel}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {step === 'not-started' && t('billing.workflow_not_started', 'Belum mula lagi')}
            {step === 'utilities-entered' && t('billing.workflow_utilities_done', `${stats.utilitiesEntered} utiliti dimasukkan`)}
            {step === 'ready-to-send' && t('billing.workflow_ready', `${stats.totalBills} bil dijana`)}
            {step === 'collecting' && t('billing.workflow_collecting', `${stats.billsPaid} / ${stats.totalBills} dibayar`)}
          </p>
        </div>
        <StepIndicator step={step} />
      </div>

      {step === 'collecting' && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">{t('billing.collection_rate', 'Kadar kutipan')}</span>
            <span className="text-xs font-bold text-primary-600">{collectionPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${collectionPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {step === 'not-started' && (
          <Button icon={Receipt} fullWidth onClick={onEnterUtilities}>
            {t('billing.enter_utilities', 'Masukkan bil utiliti')} →
          </Button>
        )}
        {step === 'utilities-entered' && (
          <Button icon={Eye} fullWidth onClick={onPreviewGenerate}>
            {t('billing.preview_generate', 'Semak & jana bil')} →
          </Button>
        )}
        {step === 'ready-to-send' && (
          <Button icon={Send} fullWidth onClick={onViewBills}>
            {t('billing.review_send', 'Semak & hantar')} →
          </Button>
        )}
        {step === 'collecting' && (
          <>
            <Button icon={BarChart3} variant="secondary" className="flex-1" onClick={onViewBills}>
              {t('billing.view_bills', 'Lihat bil')}
            </Button>
            {unpaid > 0 && (
              <Button icon={Send} className="flex-1" onClick={onSendReminders}>
                {t('billing.send_reminders', 'Hantar peringatan')}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
