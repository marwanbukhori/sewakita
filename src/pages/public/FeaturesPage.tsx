import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Receipt, Users, FileText, BarChart3, MessageCircle, ArrowRight, Eye, CreditCard, Phone, Menu, X } from 'lucide-react'
import { BatikHeroOverlay, BatikDivider } from '@/assets/batik/patterns'
import LanguageToggle from '@/components/ui/LanguageToggle'

type Role = 'landlord' | 'tenant'

const LANDLORD_MODULES = [
  {
    icon: Building2,
    titleKey: 'fp.mod_property_title',
    bullets: ['fp.mod_property_1', 'fp.mod_property_2', 'fp.mod_property_3', 'fp.mod_property_4'],
  },
  {
    icon: Receipt,
    titleKey: 'fp.mod_billing_title',
    bullets: ['fp.mod_billing_1', 'fp.mod_billing_2', 'fp.mod_billing_3', 'fp.mod_billing_4'],
  },
  {
    icon: Users,
    titleKey: 'fp.mod_tenants_title',
    bullets: ['fp.mod_tenants_1', 'fp.mod_tenants_2', 'fp.mod_tenants_3', 'fp.mod_tenants_4'],
  },
  {
    icon: FileText,
    titleKey: 'fp.mod_agreements_title',
    bullets: ['fp.mod_agreements_1', 'fp.mod_agreements_2', 'fp.mod_agreements_3', 'fp.mod_agreements_4'],
  },
  {
    icon: BarChart3,
    titleKey: 'fp.mod_reports_title',
    badgeKey: 'fp.pro_badge',
    bullets: ['fp.mod_reports_1', 'fp.mod_reports_2', 'fp.mod_reports_3', 'fp.mod_reports_4', 'fp.mod_reports_5'],
  },
  {
    icon: MessageCircle,
    titleKey: 'fp.mod_notifications_title',
    bullets: ['fp.mod_notifications_1', 'fp.mod_notifications_2', 'fp.mod_notifications_3', 'fp.mod_notifications_4'],
  },
]

const TENANT_MODULES = [
  { icon: Eye, titleKey: 'fp.tenant_bills_title', descKey: 'fp.tenant_bills_desc' },
  { icon: CreditCard, titleKey: 'fp.tenant_payments_title', descKey: 'fp.tenant_payments_desc' },
  { icon: FileText, titleKey: 'fp.tenant_agreement_title', descKey: 'fp.tenant_agreement_desc' },
  { icon: Phone, titleKey: 'fp.tenant_contact_title', descKey: 'fp.tenant_contact_desc' },
]

export default function FeaturesPage() {
  const { t } = useTranslation()
  const [role, setRole] = useState<Role>('landlord')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/logos/logo-mobile.svg" alt="ReRumah" className={`h-7 transition-all ${scrolled ? '' : 'brightness-0 invert'}`} />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-primary-600' : 'text-white'}`}>
              {t('landing.nav_features')}
            </Link>
            <Link to="/" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>
              {t('landing.nav_pricing')}
            </Link>
            <LanguageToggle />
            <Link to="/login" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>
              {t('landing.nav_login')}
            </Link>
            <Link to="/login" className="bg-white text-primary-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-md transition-all hover:shadow-lg active:scale-95">
              {t('landing.nav_cta')}
            </Link>
          </nav>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg">
            {mobileMenu
              ? <X size={22} className={scrolled ? 'text-gray-800' : 'text-white'} />
              : <Menu size={22} className={scrolled ? 'text-gray-800' : 'text-white'} />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-in">
            <div className="px-5 py-4 space-y-3">
              <Link to="/features" onClick={() => setMobileMenu(false)} className="block w-full text-left text-sm font-semibold text-primary-600 py-2">
                {t('landing.nav_features')}
              </Link>
              <Link to="/" onClick={() => setMobileMenu(false)} className="block w-full text-left text-sm font-medium text-gray-700 py-2">
                {t('landing.nav_pricing')}
              </Link>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Language</span>
                <LanguageToggle />
              </div>
              <Link to="/login" className="block w-full text-center bg-primary-600 text-white py-3 rounded-xl text-sm font-bold mt-2">
                {t('landing.nav_cta')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        <BatikHeroOverlay />
        <div className="relative z-10 max-w-6xl mx-auto px-5 pt-32 pb-16 md:pt-40 md:pb-20 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {t('fp.hero_title')}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            {t('fp.hero_subtitle')}
          </p>

          {/* Role toggle */}
          <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-xl p-1">
            {(['landlord', 'tenant'] as Role[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-white text-primary-700 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t(`fp.role_${r}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 30C360 60 720 0 1080 30C1260 45 1380 15 1440 30V60H0Z" fill="#F7FAFC" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURE MODULES ===== */}
      <section className="py-16 md:py-24 bg-[#F7FAFC]">
        <div className="max-w-6xl mx-auto px-5">

          {role === 'landlord' ? (
            <div className="grid md:grid-cols-2 gap-6">
              {LANDLORD_MODULES.map((mod, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                      <mod.icon size={24} className="text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-lg">{t(mod.titleKey)}</h3>
                        {mod.badgeKey && (
                          <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase">
                            {t(mod.badgeKey)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2.5 ml-1">
                    {mod.bullets.map((key, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                        <span>{t(key)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {TENANT_MODULES.map((mod, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow text-center">
                  <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <mod.icon size={28} className="text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t(mod.titleKey)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(mod.descKey)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        <BatikHeroOverlay />
        <div className="relative z-10 max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('fp.cta_title')}</h2>
          <p className="text-white/70 mb-8">{t('fp.cta_subtitle')}</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-xl transition-all hover:shadow-2xl active:scale-95">
            {t('fp.cta_button')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <img src="/logos/logo-mobile.svg" alt="ReRumah" className="h-7 brightness-0 invert opacity-80" />
              <p className="text-sm text-gray-400 mt-1">{t('landing.footer_tagline')}</p>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/features" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('landing.nav_features')}
              </Link>
              <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('landing.nav_pricing')}
              </Link>
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('landing.nav_login')}
              </Link>
            </div>
          </div>

          <BatikDivider />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-xs text-gray-500">{t('landing.footer_made')}</p>
            <div className="flex items-center gap-4">
              <a href="mailto:marwanbukhori.dev@gmail.com" className="text-xs text-gray-500 hover:text-gray-300">
                marwanbukhori.dev@gmail.com
              </a>
              <LanguageToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
