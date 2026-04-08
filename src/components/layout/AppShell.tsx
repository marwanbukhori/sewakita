import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Home, Building2, Receipt, CreditCard, Menu, X, LogOut, ChevronRight, HelpCircle, User, BarChart3, Globe, Flag } from 'lucide-react'
import { getActiveSubscription, type SubscriptionWithPlan } from '@/lib/subscription'
import { ONLINE_PAYMENTS_ENABLED, getPlanTier } from '@/lib/feature-gates'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import LanguageToggle from '@/components/ui/LanguageToggle'
import { BatikNavOverlay, BatikNavRing, BatikHeroOverlay } from '@/assets/batik/patterns'
import { useTranslation } from 'react-i18next'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
  badge?: number
  isCenter?: boolean
}

export default function AppShell() {
  const { profile, role, signOut } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [overdueCount, setOverdueCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 0)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (!profile || role !== 'landlord') return
    loadOverdueCount()
    getActiveSubscription(profile.id).then(setSubscription)
  }, [profile, role])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  async function loadOverdueCount() {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { count } = await supabase
      .from('monthly_bills')
      .select('*, rooms!inner(properties!inner(landlord_id))', { count: 'exact', head: true })
      .eq('rooms.properties.landlord_id', profile!.id)
      .eq('status', 'overdue')
      .eq('month', currentMonth)
    setOverdueCount(count || 0)
  }

  function handleLogout() {
    setShowLogoutConfirm(true)
    setMenuOpen(false)
  }

  function confirmLogout() {
    setShowLogoutConfirm(false)
    signOut()
  }

  const landlordNav: NavItem[] = [
    { to: '/dashboard', label: t('nav.home'), icon: Home },
    { to: '/bil', label: t('nav.billing'), icon: Receipt, badge: overdueCount },
    { to: '/properties', label: t('nav.properties'), icon: Building2 },
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
  ]

  const tenantNav: NavItem[] = [
    { to: '/tenant/dashboard', label: t('nav.home'), icon: Home },
    { to: '/tenant/bills', label: t('nav.billing'), icon: Receipt },
    { to: '/tenant/payments', label: t('nav.payments'), icon: CreditCard },
  ]

  const sidebarMainNav = role === 'tenant' ? tenantNav : landlordNav
  const nav = role === 'tenant' ? tenantNav : landlordNav

  const menuItems = [
    { icon: User, label: t('account.personal_info'), to: '/account' },
    ...(role === 'landlord' && ONLINE_PAYMENTS_ENABLED ? [
      { icon: CreditCard, label: t('account.payment_settings', 'Payment Settings'), to: '/account/payment-settings' },
    ] : []),
    { icon: HelpCircle, label: t('menu.faq'), to: '/faq' },
    { icon: Flag, label: t('report.title'), to: '/report' },
  ]

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Header */}
      <header className={`relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 sticky top-0 z-50 safe-top transition-shadow duration-200 overflow-hidden ${scrolled ? 'shadow-md' : ''}`}>
        <BatikHeroOverlay className="!opacity-[0.08]" />
        <div className="relative z-10 max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-white">ReRumah</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-lg text-white/80 hover:bg-white/10"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 top-14 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 w-72 bg-white shadow-xl rounded-bl-2xl animate-in">
            {/* Profile */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shrink-0">
                  {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{profile?.name}</p>
                  <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                    {role === 'landlord' ? t('onboarding.landlord') : t('onboarding.tenant')}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              {menuItems.map((item) => (
                <Link key={item.to} to={item.to} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <item.icon size={18} className="text-gray-500" />
                  <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              ))}
            </div>

            {/* Language toggle in hamburger */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-gray-500" />
                <span className="text-sm text-gray-800">Language</span>
              </div>
              <LanguageToggle />
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 py-2">
              <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-3 w-full hover:bg-red-50">
                <LogOut size={18} className="text-danger-500" />
                <span className="text-sm font-medium text-danger-500">{t('menu.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto flex">
        {/* Desktop sidebar */}
        <nav className="hidden sm:flex flex-col w-56 shrink-0 bg-white shadow-sm min-h-[calc(100vh-3.5rem)] py-4 px-3">
          <div className="space-y-1">
            {sidebarMainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-danger-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
          <div className="my-4 border-t border-gray-100" />
          <div className="space-y-1">
            <NavLink to="/account" className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
            }><User size={20} /><span>{t('nav.account')}</span></NavLink>
            {role === 'landlord' && ONLINE_PAYMENTS_ENABLED && (
              <NavLink to="/account/payment-settings" className={({ isActive }) =>
                `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
              }><CreditCard size={20} /><span>{t('account.payment_settings', 'Payment Settings')}</span></NavLink>
            )}
            <NavLink to="/faq" className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
            }><HelpCircle size={20} /><span>{t('menu.faq')}</span></NavLink>
            <NavLink to="/report" className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
            }><Flag size={20} /><span>{t('report.title')}</span></NavLink>

            {/* Language toggle */}
            <div className="flex items-center justify-between px-3 h-11">
              <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                <Globe size={20} />
                <span>Language</span>
              </div>
              <LanguageToggle />
            </div>

            {/* Logout */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-danger-500 font-medium hover:bg-red-50 w-full transition-colors">
                <LogOut size={20} />
                <span>{t('menu.logout')}</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-3.5rem)] pb-24 sm:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — BLUE with white batik */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 safe-bottom">
        <div className="relative">
          {/* Blue background with batik */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
            <BatikNavOverlay />
          </div>

          <div className={`relative grid ${nav.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} items-end h-[60px]`}>
            {nav.map((item) => {
              const isActive = location.pathname === item.to ||
                (item.to !== '/dashboard' && item.to !== '/tenant/dashboard' && location.pathname.startsWith(item.to))

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative flex flex-col items-center justify-center pb-2 pt-2.5 active:scale-95 transition-all ${
                    isActive ? 'text-white' : 'text-white/50'
                  }`}
                >
                  {isActive && <div className="absolute top-0 w-8 h-1 rounded-full bg-white" />}
                  <div className="relative">
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-danger-500 text-white text-[8px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      <BottomSheet open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title={t('account.logout')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{t('account.logout_confirm')}</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" className="flex-1" onClick={confirmLogout}>{t('account.logout')}</Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
