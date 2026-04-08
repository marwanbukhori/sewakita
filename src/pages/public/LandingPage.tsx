import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Receipt, CreditCard, FileText, MessageCircle, BarChart3, ChevronDown, ChevronUp, Zap, Shield, Smartphone, ArrowRight, Check, Menu, X } from 'lucide-react'
import { BatikHeroOverlay, BatikDivider } from '@/assets/batik/patterns'
import LanguageToggle from '@/components/ui/LanguageToggle'

const FEATURES = [
  { icon: Building2, titleKey: 'landing.feat_property', descKey: 'landing.feat_property_desc' },
  { icon: Receipt, titleKey: 'landing.feat_billing', descKey: 'landing.feat_billing_desc' },
  { icon: CreditCard, titleKey: 'landing.feat_payments', descKey: 'landing.feat_payments_desc' },
  { icon: FileText, titleKey: 'landing.feat_agreements', descKey: 'landing.feat_agreements_desc' },
  { icon: MessageCircle, titleKey: 'landing.feat_whatsapp', descKey: 'landing.feat_whatsapp_desc' },
  { icon: BarChart3, titleKey: 'landing.feat_reports', descKey: 'landing.feat_reports_desc' },
]

const STEPS = [
  { num: '01', titleKey: 'landing.step1_title', descKey: 'landing.step1_desc', icon: Building2 },
  { num: '02', titleKey: 'landing.step2_title', descKey: 'landing.step2_desc', icon: Smartphone },
  { num: '03', titleKey: 'landing.step3_title', descKey: 'landing.step3_desc', icon: Zap },
]

const FREE_FEATURES = [
  'landing.free_feat_1', 'landing.free_feat_2', 'landing.free_feat_3',
  'landing.free_feat_4', 'landing.free_feat_5',
]

const PRO_FEATURES = [
  'landing.pro_feat_1', 'landing.pro_feat_2', 'landing.pro_feat_3',
  'landing.pro_feat_4', 'landing.pro_feat_5', 'landing.pro_feat_6',
]

const FAQ_ITEMS = [
  { q: 'landing.faq1_q', a: 'landing.faq1_a' },
  { q: 'landing.faq2_q', a: 'landing.faq2_a' },
  { q: 'landing.faq3_q', a: 'landing.faq3_a' },
  { q: 'landing.faq4_q', a: 'landing.faq4_a' },
  { q: 'landing.faq5_q', a: 'landing.faq5_a' },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    setMobileMenu(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <img src="/logos/logo-mobile.svg" alt="ReRumah" className={`h-7 transition-all ${scrolled ? '' : 'brightness-0 invert'}`} />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>
              {t('landing.nav_features')}
            </Link>
            {['pricing', 'faq'].map(id => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>
                {t(`landing.nav_${id}`)}
              </button>
            ))}
            <LanguageToggle />
            <Link to="/login" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>
              {t('landing.nav_login')}
            </Link>
            <Link to="/login" className="bg-white text-primary-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-md transition-all hover:shadow-lg active:scale-95">
              {t('landing.nav_cta')}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg">
            {mobileMenu
              ? <X size={22} className={scrolled ? 'text-gray-800' : 'text-white'} />
              : <Menu size={22} className={scrolled ? 'text-gray-800' : 'text-white'} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-in">
            <div className="px-5 py-4 space-y-3">
              <Link to="/features" onClick={() => setMobileMenu(false)} className="block w-full text-left text-sm font-medium text-gray-700 py-2">
                {t('landing.nav_features')}
              </Link>
              {['pricing', 'faq'].map(id => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm font-medium text-gray-700 py-2">
                  {t(`landing.nav_${id}`)}
                </button>
              ))}
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
        <div className="relative z-10 max-w-6xl mx-auto px-5 pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/90 font-medium">{t('landing.hero_badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('landing.hero_title')}
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-xl">
              {t('landing.hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-lg transition-all hover:shadow-xl active:scale-95">
                {t('landing.hero_cta')} <ArrowRight size={16} />
              </Link>
              <button onClick={() => scrollTo('features')} className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-7 py-3.5 rounded-xl text-sm font-medium hover:bg-white/20 transition-all active:scale-95">
                {t('landing.hero_secondary')}
              </button>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== STATS STRIP ===== */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: t('landing.stat_free_value'), label: t('landing.stat_free_label') },
              { value: 'RM19', label: t('landing.stat_pro_label') },
              { value: '2', label: t('landing.stat_lang_label') },
              { value: 'PWA', label: t('landing.stat_pwa_label') },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">{t('landing.features_label')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('landing.features_title')}</h2>
            <p className="text-gray-500 max-w-lg mx-auto">{t('landing.features_subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <feat.icon size={24} className="text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t(feat.titleKey)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(feat.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 md:py-24 bg-[#F7FAFC]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">{t('landing.how_label')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('landing.how_title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <step.icon size={32} className="text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-primary-600 text-xs font-bold flex items-center justify-center shadow-md">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t(step.titleKey)}</h3>
                <p className="text-sm text-gray-500">{t(step.descKey)}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">{t('landing.pricing_label')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('landing.pricing_title')}</h2>
          </div>

          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            {/* Free tier */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-8">
              <div className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-bold text-gray-600 mb-4">
                {t('landing.free_badge')}
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">RM0</span>
                <span className="text-gray-400 ml-2">{t('landing.free_period')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((key, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check size={16} className="text-primary-500 shrink-0" />
                    <span className="text-gray-600">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block w-full text-center border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95">
                {t('landing.free_cta')}
              </Link>
            </div>

            {/* Pro tier */}
            <div className="relative bg-white rounded-3xl border-2 border-primary-200 p-8 shadow-xl overflow-hidden">
              <BatikHeroOverlay />
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl" style={{ zIndex: 0 }} />
              <div className="relative z-10 text-white">
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold mb-4">
                  {t('landing.pro_badge')}
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold">RM19</span>
                  <span className="text-white/60 ml-2">{t('landing.pro_period')}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {PRO_FEATURES.map((key, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check size={16} className="text-green-300 shrink-0" />
                      <span className="text-white/90">{t(key)}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block w-full text-center bg-white text-primary-700 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-md">
                  {t('landing.pro_cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-16 md:py-24 bg-[#F7FAFC]">
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('landing.faq_title')}</h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm pr-4">{t(item.q)}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 animate-in">
                    <p className="text-sm text-gray-500 leading-relaxed">{t(item.a)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        <BatikHeroOverlay />
        <div className="relative z-10 max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('landing.cta_title')}</h2>
          <p className="text-white/70 mb-8">{t('landing.cta_subtitle')}</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-xl transition-all hover:shadow-2xl active:scale-95">
            {t('landing.cta_button')} <ArrowRight size={16} />
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
              {['pricing', 'faq'].map(id => (
                <button key={id} onClick={() => scrollTo(id)} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t(`landing.nav_${id}`)}
                </button>
              ))}
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
