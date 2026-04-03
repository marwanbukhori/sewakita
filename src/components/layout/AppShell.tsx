import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Home, Building2, Receipt, CreditCard, Menu, X, CircleUser, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
  badge?: number
}

export default function AppShell() {
  const { profile, role, signOut } = useAuth()
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

  // Close menu on route change
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
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/properties', label: 'Hartanah', icon: Building2 },
    { to: '/billing', label: 'Bil', icon: Receipt, badge: overdueCount },
    { to: '/payments', label: 'Bayaran', icon: CreditCard },
  ]

  const tenantNav: NavItem[] = [
    { to: '/tenant/dashboard', label: 'Dashboard', icon: Home },
    { to: '/tenant/bills', label: 'Bil Saya', icon: Receipt },
    { to: '/tenant/payments', label: 'Bayaran', icon: CreditCard },
  ]

  // Desktop sidebar includes Account
  const landlordSidebarNav: NavItem[] = [
    ...landlordNav,
    { to: '/account', label: 'Akaun', icon: CircleUser },
  ]
  const tenantSidebarNav: NavItem[] = [
    ...tenantNav,
    { to: '/account', label: 'Akaun', icon: CircleUser },
  ]

  const nav = role === 'tenant' ? tenantNav : landlordNav
  const sidebarNav = role === 'tenant' ? tenantSidebarNav : landlordSidebarNav

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Top bar */}
      <header className={`bg-primary-700 text-white sticky top-0 z-50 safe-top transition-shadow duration-200 ${scrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">SewaKita</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-primary-200 hidden sm:block">{profile?.name}</span>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-primary-800"
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
            {/* Profile section */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold shrink-0">
                  {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{profile?.name}</p>
                  <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                    {role === 'landlord' ? 'Tuan Rumah' : 'Penyewa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              <Link
                to="/account"
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
              >
                <CircleUser size={18} className="text-gray-500" />
                <span className="flex-1 text-sm text-gray-800">Akaun Saya</span>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
              <Link
                to="/account"
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
              >
                <Settings size={18} className="text-gray-500" />
                <span className="flex-1 text-sm text-gray-800">Tetapan</span>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-5 py-3 w-full hover:bg-red-50"
              >
                <LogOut size={18} className="text-danger-500" />
                <span className="text-sm font-medium text-danger-500">Log Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto flex">
        {/* Desktop sidebar */}
        <nav className="hidden sm:flex flex-col w-56 shrink-0 bg-white shadow-sm min-h-[calc(100vh-3.5rem)] py-4 px-3 gap-1">
          {sidebarNav.map((item) => (
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
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-3.5rem)] pb-24 sm:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — no Account tab, it's in hamburger */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="flex justify-around">
          {nav.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/dashboard' && item.to !== '/tenant/dashboard' && location.pathname.startsWith(item.to))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center min-h-[56px] flex-1 ${
                  isActive ? 'text-primary-700' : 'text-gray-400'
                }`}
              >
                <div className={`flex items-center justify-center w-12 h-8 rounded-2xl transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className={`text-[11px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1.5 right-1/4 bg-danger-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Logout confirmation */}
      <BottomSheet open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Log Keluar">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Adakah anda pasti mahu log keluar dari SewaKita?</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>
              Batal
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmLogout}>
              Log Keluar
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
