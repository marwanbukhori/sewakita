import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const faqKeys = [1, 2, 3, 4, 5, 6, 7, 8]

export default function FAQPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        {t('common.back')}
      </Button>

      <div>
        <h1 className="text-xl font-bold text-gray-800">{t('faq.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('faq.subtitle')}</p>
      </div>

      <div className="space-y-2">
        {faqKeys.map((n, i) => (
          <Card key={i} variant="default" padding="p-0">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex-1 text-sm font-medium text-gray-800">{t(`faq.q${n}`)}</span>
              {openIndex === i
                ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                : <ChevronDown size={16} className="text-gray-400 shrink-0" />
              }
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-600 leading-relaxed">{t(`faq.a${n}`)}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
