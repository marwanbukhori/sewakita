import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Building2, ChevronRight, LogOut, Shield, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'

export default function AccountPage() {
  const { profile, role, signOut } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  function confirmLogout() {
    setShowLogoutConfirm(false)
    signOut()
  }

  const settingsGroups = [
    {
      title: 'Akaun',
      items: [
        { icon: User, label: 'Maklumat peribadi', to: '#' },
        ...(role === 'landlord' ? [{ icon: Building2, label: 'Hartanah saya', to: '/properties' }] : []),
        // { icon: Bell, label: 'Tetapan notifikasi', to: '#' },
      ],
    },
    {
      title: 'Keselamatan',
      items: [
        { icon: Shield, label: 'Tukar kata laluan', to: '#' },
      ],
    },
  ]

  return (
    <div className="space-y-5 animate-in">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{profile?.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
              {role === 'landlord' ? 'Tuan Rumah' : 'Penyewa'}
            </span>
            {profile?.phone && (
              <span className="text-xs text-gray-500">{profile.phone}</span>
            )}
          </div>
        </div>
      </div>

      {/* Settings groups */}
      {settingsGroups.map((group) => (
        <div key={group.title}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{group.title}</p>
          <Card variant="elevated" padding="p-0">
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <item.icon size={18} className="text-gray-500" />
                  <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      ))}

      {/* Logout */}
      <Card variant="elevated" padding="p-0">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors rounded-2xl"
        >
          <LogOut size={18} className="text-danger-500" />
          <span className="text-sm font-medium text-danger-500">Log Keluar</span>
        </button>
      </Card>

      <p className="text-center text-xs text-gray-400 pb-4">SewaKita v1.0</p>

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
