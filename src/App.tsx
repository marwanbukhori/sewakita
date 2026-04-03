import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/auth-context'

import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/auth/LoginPage'
import OnboardingPage from '@/pages/auth/OnboardingPage'

import DashboardPage from '@/pages/landlord/DashboardPage'
import PropertiesPage from '@/pages/landlord/PropertiesPage'
import PropertyFormPage from '@/pages/landlord/PropertyFormPage'
import PropertyDetailPage from '@/pages/landlord/PropertyDetailPage'
import TenantsPage from '@/pages/landlord/TenantsPage'
import TenantFormPage from '@/pages/landlord/TenantFormPage'
import BillingPage from '@/pages/landlord/BillingPage'
import PaymentsPage from '@/pages/landlord/PaymentsPage'

import TenantDashboard from '@/pages/tenant/TenantDashboard'
import TenantBillsPage from '@/pages/tenant/TenantBillsPage'
import TenantPaymentsPage from '@/pages/tenant/TenantPaymentsPage'
import AccountPage from '@/pages/shared/AccountPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Memuatkan...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    )
  }

  if (profile.role === 'tenant') {
    return (
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/tenant/dashboard" element={<TenantDashboard />} />
          <Route path="/tenant/bills" element={<TenantBillsPage />} />
          <Route path="/tenant/payments" element={<TenantPaymentsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/new" element={<PropertyFormPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/new" element={<TenantFormPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/account" element={<AccountPage />} />
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
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      </AuthProvider>
    </BrowserRouter>
  )
}
