import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Home, Building2, Receipt, CreditCard, Menu, X, LogOut, ChevronRight, HelpCircle, User, BarChart3, FileText, Shield } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import LanguageToggle from '@/components/ui/LanguageToggle'
import { BatikNavRing } from '@/assets/batik/patterns'
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

  // 3-icon bottom nav: Home | Billing (center, raised) | Properties/Payments
  const landlordNav: NavItem[] = [
    { to: '/dashboard', label: t('nav.home'), icon: Home },
    { to: '/bil', label: t('nav.billing'), icon: Receipt, badge: overdueCount, isCenter: true },
    { to: '/properties', label: t('nav.properties'), icon: Building2 },
  ]

  const tenantNav: NavItem[] = [
    { to: '/tenant/dashboard', label: t('nav.home'), icon: Home },
    { to: '/tenant/bills', label: t('nav.billing'), icon: Receipt, isCenter: true },
    { to: '/tenant/payments', label: t('nav.payments'), icon: CreditCard },
  ]

  // Sidebar nav includes account section
  const sidebarMainNav = role === 'tenant' ? tenantNav : landlordNav

  const nav = role === 'tenant' ? tenantNav : landlordNav

  // Menu items for hamburger dropdown
  const menuItems = [
    { icon: User, label: t('account.personal_info'), to: '/account' },
    ...(role === 'landlord' ? [
      { icon: Building2, label: t('account.my_properties'), to: '/properties' },
      { icon: BarChart3, label: t('account.monthly_report'), to: '/account/reports/monthly' },
      { icon: FileText, label: t('account.annual_report'), to: '/account/reports/annual' },
    ] : []),
    { icon: HelpCircle, label: t('menu.faq'), to: '/faq' },
  ]

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Clean white header */}
      <header className={`bg-white sticky top-0 z-50 safe-top transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-primary-600">SewaKita</span>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <span className="text-sm text-gray-500 hidden sm:block">{profile?.name}</span>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu — expanded with account items */}
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
          {/* Main nav */}
          <div className="space-y-1">
            {sidebarMainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 font-medium hover:bg-gray-50'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-danger-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100" />

          {/* Account section */}
          <div className="space-y-1">
            <NavLink to="/account" className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
            }>
              <User size={20} />
              <span>{t('nav.account')}</span>
            </NavLink>
            {role === 'landlord' && (
              <>
                <NavLink to="/account/reports/monthly" className={({ isActive }) =>
                  `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
                }>
                  <BarChart3 size={20} />
                  <span>{t('reports.monthly_title')}</span>
                </NavLink>
                <NavLink to="/account/reports/annual" className={({ isActive }) =>
                  `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
                }>
                  <FileText size={20} />
                  <span>{t('reports.annual_title')}</span>
                </NavLink>
              </>
            )}
            <NavLink to="/faq" className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-50'}`
            }>
              <HelpCircle size={20} />
              <span>{t('menu.faq')}</span>
            </NavLink>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-3.5rem)] pb-24 sm:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — 3 icons with raised center */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="grid grid-cols-3">
          {nav.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/dashboard' && item.to !== '/tenant/dashboard' && location.pathname.startsWith(item.to))

            // Center icon — raised with circle background
            if (item.isCenter) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="relative flex flex-col items-center justify-center py-1"
                >
                  <div className={`relative -mt-5 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-primary-300/50'
                      : 'bg-white text-primary-600 border-2 border-primary-100'
                  }`}>
                    <BatikNavRing className={isActive ? 'text-white' : 'text-primary-400'} />
                    <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-primary-600' : 'font-medium text-gray-400'}`}>
                    {item.label}
                  </span>
                </NavLink>
              )
            }

            // Regular nav items
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center py-2.5 ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <div className={`flex items-center justify-center w-12 h-7 rounded-2xl transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className={`text-[11px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Logout confirmation */}
      <BottomSheet open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title={t('account.logout')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{t('account.logout_confirm')}</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmLogout}>
              {t('account.logout')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
