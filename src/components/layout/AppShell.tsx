import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Home, Building2, Users, Receipt, CreditCard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const landlordNav = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/properties', label: 'Hartanah', icon: Building2 },
  { to: '/tenants', label: 'Penyewa', icon: Users },
  { to: '/billing', label: 'Bil', icon: Receipt },
  { to: '/payments', label: 'Bayaran', icon: CreditCard },
]

const tenantNav = [
  { to: '/tenant/dashboard', label: 'Dashboard', icon: Home },
  { to: '/tenant/bills', label: 'Bil Saya', icon: Receipt },
  { to: '/tenant/payments', label: 'Bayaran', icon: CreditCard },
]

export default function AppShell() {
  const { profile, signOut, role } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const nav = role === 'tenant' ? tenantNav : landlordNav

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-primary-700 text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">SewaKita</span>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:block">{profile?.name}</span>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-primary-800 transition-colors"
              title="Log keluar"
            >
              <LogOut size={18} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-primary-800 sm:hidden transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto flex">
        {/* Desktop sidebar */}
        <nav className="hidden sm:flex flex-col w-52 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-3.5rem)] p-3 gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile nav overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-14 z-40 sm:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
            <nav className="relative bg-white w-64 min-h-full p-3 flex flex-col gap-1 shadow-lg">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-3.5rem)]">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {nav.slice(0, 5).map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                  isActive ? 'text-primary-700' : 'text-gray-400'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
