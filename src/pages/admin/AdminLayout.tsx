import { Outlet, NavLink, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard, Settings, Flag, CreditCard, Tag,
  Users, Receipt, DollarSign, Bell, FileText, AlertTriangle,
  Clock, Activity, Shield, ChevronLeft, Menu, X,
} from 'lucide-react'
import { useState } from 'react'

interface NavGroup {
  label: string
  items: { to: string; label: string; icon: typeof LayoutDashboard }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/admin/config', label: 'Config', icon: Settings },
      { to: '/admin/flags', label: 'Feature Flags', icon: Flag },
      { to: '/admin/plans', label: 'Plans & Pricing', icon: CreditCard },
      { to: '/admin/promo-codes', label: 'Promo Codes', icon: Tag },
    ],
  },
  {
    label: 'Data & Users',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: Receipt },
      { to: '/admin/payments', label: 'Payments', icon: DollarSign },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/bill-generation', label: 'Bill Generation', icon: FileText },
      { to: '/admin/payment-claims', label: 'Payment Claims', icon: AlertTriangle },
      { to: '/admin/cron-health', label: 'Cron Health', icon: Clock },
      { to: '/admin/activity', label: 'Activity Log', icon: Activity },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/audit', label: 'Audit Log', icon: Shield },
    ],
  },
]

export default function AdminLayout() {
  const { isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft size={16} />
          Back to Dashboard
        </Link>
        <h1 className="mt-2 text-lg font-bold text-gray-900">Admin Panel</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="sm:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
        <Link to="/dashboard" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} />
        </Link>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sm:hidden fixed inset-0 top-12 z-30">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 w-64 h-full bg-white shadow-xl overflow-y-auto">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden sm:block w-60 shrink-0 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          {sidebar}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
