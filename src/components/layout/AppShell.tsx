import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Home, Building2, Receipt, CreditCard, CircleUser } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
  badge?: number
}

export default function AppShell() {
  const { profile, role } = useAuth()
  const location = useLocation()
  const [overdueCount, setOverdueCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

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

  const landlordNav: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/properties', label: 'Hartanah', icon: Building2 },
    { to: '/billing', label: 'Bil', icon: Receipt, badge: overdueCount },
    { to: '/payments', label: 'Bayaran', icon: CreditCard },
    { to: '/account', label: 'Akaun', icon: CircleUser },
  ]

  const tenantNav: NavItem[] = [
    { to: '/tenant/dashboard', label: 'Dashboard', icon: Home },
    { to: '/tenant/bills', label: 'Bil Saya', icon: Receipt },
    { to: '/tenant/payments', label: 'Bayaran', icon: CreditCard },
    { to: '/account', label: 'Akaun', icon: CircleUser },
  ]

  const nav = role === 'tenant' ? tenantNav : landlordNav

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Top bar — scroll-aware shadow */}
      <header className={`bg-primary-700 text-white sticky top-0 z-50 safe-top transition-shadow duration-200 ${scrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">SewaKita</span>
          <span className="text-sm text-primary-200 hidden sm:block">{profile?.name}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto flex">
        {/* Desktop sidebar */}
        <nav className="hidden sm:flex flex-col w-56 shrink-0 bg-white shadow-sm min-h-[calc(100vh-3.5rem)] py-4 px-3 gap-1">
          {nav.map((item) => (
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

      {/* Mobile bottom nav — 48px touch targets + safe area */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="flex justify-around">
          {nav.slice(0, 5).map((item) => {
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
    </div>
  )
}
