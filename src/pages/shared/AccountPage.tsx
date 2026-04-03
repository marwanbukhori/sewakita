import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Building2, ChevronRight, LogOut, Shield, User, BarChart3, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'

export default function AccountPage() {
  const { profile, role, signOut } = useAuth()
  const { t } = useTranslation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  function confirmLogout() {
    setShowLogoutConfirm(false)
    signOut()
  }

  const settingsGroups = [
    {
      title: t('account.title'),
      items: [
        { icon: User, label: t('account.personal_info'), to: '#' },
        ...(role === 'landlord' ? [{ icon: Building2, label: t('account.my_properties'), to: '/properties' }] : []),
      ],
    },
    ...(role === 'landlord' ? [{
      title: t('account.reports'),
      items: [
        { icon: BarChart3, label: t('account.monthly_report'), to: '/account/reports/monthly' },
        { icon: FileText, label: t('account.annual_report'), to: '/account/reports/annual' },
      ],
    }] : []),
    {
      title: t('account.security'),
      items: [
        { icon: Shield, label: t('account.change_password'), to: '#' },
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
              {role === 'landlord' ? t('onboarding.landlord') : t('onboarding.tenant')}
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
          <span className="text-sm font-medium text-danger-500">{t('account.logout')}</span>
        </button>
      </Card>

      <p className="text-center text-xs text-gray-400 pb-4">{t('app.name')} {t('app.version')}</p>

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
