import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/auth-context'

import AppShell from '@/components/layout/AppShell'
import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import OnboardingPage from '@/pages/auth/OnboardingPage'
import AcceptInvitePage from '@/pages/auth/AcceptInvitePage'

import DashboardPage from '@/pages/landlord/DashboardPage'
import PropertiesPage from '@/pages/landlord/PropertiesPage'
import PropertyFormPage from '@/pages/landlord/PropertyFormPage'
import PropertyDetailPage from '@/pages/landlord/PropertyDetailPage'
import MoveOutPage from '@/pages/landlord/MoveOutPage'
import TenantsPage from '@/pages/landlord/TenantsPage'
import TenantFormPage from '@/pages/landlord/TenantFormPage'
import BilPage from '@/pages/landlord/BilPage'
import AgreementFormPage from '@/pages/landlord/AgreementFormPage'
import AgreementViewPage from '@/pages/landlord/AgreementViewPage'
import NotificationSettingsPage from '@/pages/landlord/NotificationSettingsPage'

import TenantDashboard from '@/pages/tenant/TenantDashboard'
import TenantBillsPage from '@/pages/tenant/TenantBillsPage'
import TenantPaymentsPage from '@/pages/tenant/TenantPaymentsPage'
import PaymentSuccessPage from '@/pages/tenant/PaymentSuccessPage'
import AccountPage from '@/pages/shared/AccountPage'
import ReportPage from '@/pages/shared/ReportPage'
import FAQPage from '@/pages/shared/FAQPage'
import MonthlyReportPage from '@/pages/shared/MonthlyReportPage'
import AnnualReportPage from '@/pages/shared/AnnualReportPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
            <div className="text-center animate-in">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mt-4" />
            </div>
          </div>
        } />
      </Routes>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    )
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    )
  }

  if (profile.role === 'tenant') {
    return (
      <Routes>
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route element={<AppShell />}>
          <Route path="/tenant/dashboard" element={<TenantDashboard />} />
          <Route path="/tenant/bills" element={<TenantBillsPage />} />
          <Route path="/tenant/payments" element={<TenantPaymentsPage />} />
          <Route path="/tenant/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/agreements/:id" element={<AgreementViewPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
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
        {/* Legacy route redirects */}
        <Route path="/billing" element={<Navigate to="/bil" replace />} />
        <Route path="/payments" element={<Navigate to="/bil" replace />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/account/reports/monthly" element={<MonthlyReportPage />} />
        <Route path="/account/reports/annual" element={<AnnualReportPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
