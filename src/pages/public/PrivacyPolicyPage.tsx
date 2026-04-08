import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import LanguageToggle from '@/components/ui/LanguageToggle'

export default function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={18} />
            <img src="/logos/logo-mobile.svg" alt="ReRumah" className="h-6" />
          </Link>
          <LanguageToggle />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('privacy.title')}</h1>
        <p className="text-sm text-gray-400 mb-8">{t('privacy.last_updated')}</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s1_title')}</h2>
            <p>{t('privacy.s1_body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s2_title')}</h2>
            <p className="mb-2">{t('privacy.s2_intro')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('privacy.s2_item1')}</li>
              <li>{t('privacy.s2_item2')}</li>
              <li>{t('privacy.s2_item3')}</li>
              <li>{t('privacy.s2_item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s3_title')}</h2>
            <p className="mb-2">{t('privacy.s3_intro')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('privacy.s3_item1')}</li>
              <li>{t('privacy.s3_item2')}</li>
              <li>{t('privacy.s3_item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s4_title')}</h2>
            <p>{t('privacy.s4_body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s5_title')}</h2>
            <p className="mb-2">{t('privacy.s5_intro')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('privacy.s5_item1')}</li>
              <li>{t('privacy.s5_item2')}</li>
              <li>{t('privacy.s5_item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s6_title')}</h2>
            <p>{t('privacy.s6_body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s7_title')}</h2>
            <p>{t('privacy.s7_body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('privacy.s8_title')}</h2>
            <p>{t('privacy.s8_body')}</p>
          </section>
        </div>
      </main>
    </div>
  )
}
