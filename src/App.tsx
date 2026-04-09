import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { ConfigProvider } from '@/lib/config'
import ErrorBoundary from '@/components/ErrorBoundary'
import { supabase } from '@/lib/supabase'
import { SUBSCRIPTION_PAYMENTS_ENABLED } from '@/lib/feature-gates'

// Static imports — needed during loading/auth check
import AppShell from '@/components/layout/AppShell'
import AcceptInvitePage from '@/pages/auth/AcceptInvitePage'

// Lazy-loaded pages
const LandingPage = lazy(() => import('@/pages/public/LandingPage'))
const FeaturesPage = lazy(() => import('@/pages/public/FeaturesPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/public/PrivacyPolicyPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))

const DashboardPage = lazy(() => import('@/pages/landlord/DashboardPage'))
const PropertiesPage = lazy(() => import('@/pages/landlord/PropertiesPage'))
const PropertyFormPage = lazy(() => import('@/pages/landlord/PropertyFormPage'))
const PropertyDetailPage = lazy(() => import('@/pages/landlord/PropertyDetailPage'))
const MoveOutPage = lazy(() => import('@/pages/landlord/MoveOutPage'))
const TenantsPage = lazy(() => import('@/pages/landlord/TenantsPage'))
const TenantFormPage = lazy(() => import('@/pages/landlord/TenantFormPage'))
const BilPage = lazy(() => import('@/pages/landlord/BilPage'))
const AgreementFormPage = lazy(() => import('@/pages/landlord/AgreementFormPage'))
const AgreementViewPage = lazy(() => import('@/pages/landlord/AgreementViewPage'))
const NotificationSettingsPage = lazy(() => import('@/pages/landlord/NotificationSettingsPage'))
const PlansPage = lazy(() => import('@/pages/landlord/PlansPage'))
const SubscriptionSuccessPage = lazy(() => import('@/pages/landlord/SubscriptionSuccessPage'))
const PaymentSettingsPage = lazy(() => import('@/pages/landlord/PaymentSettingsPage'))
const ReportsDashboardPage = lazy(() => import('@/pages/landlord/ReportsDashboardPage'))
const ActivityListPage = lazy(() => import('@/pages/landlord/ActivityListPage'))
const AgingReportPage = lazy(() => import('@/pages/landlord/reports/AgingReportPage'))
const OccupancyReportPage = lazy(() => import('@/pages/landlord/reports/OccupancyReportPage'))
const AgreementReportPage = lazy(() => import('@/pages/landlord/reports/AgreementReportPage'))

const TenantDashboard = lazy(() => import('@/pages/tenant/TenantDashboard'))
const TenantBillsPage = lazy(() => import('@/pages/tenant/TenantBillsPage'))
const TenantPaymentsPage = lazy(() => import('@/pages/tenant/TenantPaymentsPage'))
const TenantClaimsPage = lazy(() => import('@/pages/tenant/TenantClaimsPage'))
const PaymentSuccessPage = lazy(() => import('@/pages/tenant/PaymentSuccessPage'))
// Admin pages (lazy-loaded — only downloaded by admin users)
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminConfigPage = lazy(() => import('@/pages/admin/ConfigPage'))
const AdminFeatureFlagsPage = lazy(() => import('@/pages/admin/FeatureFlagsPage'))
const AdminPlansPage = lazy(() => import('@/pages/admin/AdminPlansPage'))
const AdminPromoCodesPage = lazy(() => import('@/pages/admin/PromoCodesPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage'))
const AdminUserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage'))
const AdminSubscriptionsPage = lazy(() => import('@/pages/admin/SubscriptionsPage'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage'))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'))
const AdminBillGenerationPage = lazy(() => import('@/pages/admin/BillGenerationPage'))
const AdminPaymentClaimsPage = lazy(() => import('@/pages/admin/PaymentClaimsPage'))
const AdminCronHealthPage = lazy(() => import('@/pages/admin/CronHealthPage'))
const AdminActivityLogPage = lazy(() => import('@/pages/admin/ActivityLogPage'))
const AdminAuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'))

const AccountPage = lazy(() => import('@/pages/shared/AccountPage'))
const ProfileEditPage = lazy(() => import('@/pages/shared/ProfileEditPage'))
const ChangePasswordPage = lazy(() => import('@/pages/shared/ChangePasswordPage'))
const ReportPage = lazy(() => import('@/pages/shared/ReportPage'))
const FAQPage = lazy(() => import('@/pages/shared/FAQPage'))
const MonthlyReportPage = lazy(() => import('@/pages/shared/MonthlyReportPage'))
const AnnualReportPage = lazy(() => import('@/pages/shared/AnnualReportPage'))

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
      <div className="text-center animate-in">
        <img src="/logos/favicon-dark.svg" alt="ReRumah" className="w-14 h-14 mx-auto mb-4 shadow-md rounded-2xl" />
        <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mt-4" />
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null)
  const [inviteChecked, setInviteChecked] = useState(false)

  // Auto-detect pending invite for authenticated users without a profile
  useEffect(() => {
    if (!user?.email || profile || loading) {
      setInviteChecked(true)
      return
    }

    // Check localStorage first (set during invite signup)
    const storedToken = localStorage.getItem('rerumah_invite_token')
    if (storedToken) {
      setPendingInviteToken(storedToken)
      setInviteChecked(true)
      return
    }

    // Query DB for pending invite matching this email
    supabase
      .from('invites')
      .select('token')
      .eq('email', user.email)
      .eq('status', 'pending')
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPendingInviteToken(data[0].token)
          localStorage.setItem('rerumah_invite_token', data[0].token)
        }
        setInviteChecked(true)
      })
  }, [user, profile, loading])

  if (loading) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route path="*" element={<LoadingSpinner />} />
      </Routes>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<AcceptInvitePage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Suspense>
    )
  }

  if (!profile) {
    if (!inviteChecked) {
      return <LoadingSpinner />
    }

    if (pendingInviteToken && !window.location.pathname.startsWith('/invite/')) {
      return <Navigate to={`/invite/${pendingInviteToken}`} replace />
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/invite/:token" element={<AcceptInvitePage />} />
          <Route path="*" element={<OnboardingPage />} />
        </Routes>
      </Suspense>
    )
  }

  if (profile.role === 'tenant') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/invite/:token" element={<AcceptInvitePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route element={<AppShell />}>
            <Route path="/tenant/dashboard" element={<TenantDashboard />} />
            <Route path="/tenant/bills" element={<TenantBillsPage />} />
            <Route path="/tenant/payments" element={<TenantPaymentsPage />} />
            <Route path="/tenant/claims" element={<TenantClaimsPage />} />
            <Route path="/tenant/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/agreements/:id" element={<AgreementViewPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/edit" element={<ProfileEditPage />} />
            <Route path="/account/password" element={<ChangePasswordPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/faq" element={<FAQPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/new" element={<PropertyFormPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/properties/:propertyId/rooms/:roomId/move-out" element={<MoveOutPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/tenants/new" element={<TenantFormPage />} />
          <Route path="/agreements/new" element={<AgreementFormPage />} />
          <Route path="/agreements/:id" element={<AgreementViewPage />} />
          <Route path="/properties/:id/notifications" element={<NotificationSettingsPage />} />
          <Route path="/bil" element={<BilPage />} />
          <Route path="/activity" element={<ActivityListPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/plans/success" element={SUBSCRIPTION_PAYMENTS_ENABLED ? <SubscriptionSuccessPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/account/payment-settings" element={SUBSCRIPTION_PAYMENTS_ENABLED ? <PaymentSettingsPage /> : <Navigate to="/dashboard" replace />} />
          {/* Legacy route redirects */}
          <Route path="/billing" element={<Navigate to="/bil" replace />} />
          <Route path="/payments" element={<Navigate to="/bil" replace />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/edit" element={<ProfileEditPage />} />
          <Route path="/account/password" element={<ChangePasswordPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/reports" element={<ReportsDashboardPage />} />
          <Route path="/reports/monthly" element={<MonthlyReportPage />} />
          <Route path="/reports/annual" element={<AnnualReportPage />} />
          <Route path="/reports/aging" element={<AgingReportPage />} />
          <Route path="/reports/occupancy" element={<OccupancyReportPage />} />
          <Route path="/reports/agreements" element={<AgreementReportPage />} />
          {/* Legacy redirects */}
          <Route path="/account/reports/monthly" element={<Navigate to="/reports/monthly" replace />} />
          <Route path="/account/reports/annual" element={<Navigate to="/reports/annual" replace />} />
          <Route path="/faq" element={<FAQPage />} />
        </Route>
        {/* Admin routes — nested outside AppShell, uses own AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="config" element={<AdminConfigPage />} />
          <Route path="flags" element={<AdminFeatureFlagsPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="promo-codes" element={<AdminPromoCodesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="bill-generation" element={<AdminBillGenerationPage />} />
          <Route path="payment-claims" element={<AdminPaymentClaimsPage />} />
          <Route path="cron-health" element={<AdminCronHealthPage />} />
          <Route path="activity" element={<AdminActivityLogPage />} />
          <Route path="audit" element={<AdminAuditLogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ConfigProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 8px 28px rgba(0,0,0,0.1)',
              },
              success: { style: { background: '#f0fdf4', color: '#15803d' } },
              error: { style: { background: '#fef2f2', color: '#b91c1c' } },
            }}
          />
        </AuthProvider>
        </ConfigProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
