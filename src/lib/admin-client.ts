import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}

export async function adminFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-api${path}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Admin API error: ${res.status}`)
  return data as T
}

// Config
export const getConfig = () => adminFetch<{ data: any[] }>('/config')
export const updateConfig = (key: string, value: unknown, description?: string) =>
  adminFetch(`/config/${encodeURIComponent(key)}`, { method: 'PUT', body: { value, description } })
export const createConfig = (entry: { key: string; value: unknown; description?: string; category: string }) =>
  adminFetch('/config', { method: 'POST', body: entry })

// Feature flags
export const getFlags = () => adminFetch<{ data: any[] }>('/flags')
export const updateFlag = (key: string, updates: { enabled?: boolean; tier?: string; description?: string }) =>
  adminFetch(`/flags/${encodeURIComponent(key)}`, { method: 'PUT', body: updates })

// Plans
export const getPlans = () => adminFetch<{ data: any[] }>('/plans')
export const updatePlan = (code: string, updates: Record<string, unknown>) =>
  adminFetch(`/plans/${encodeURIComponent(code)}`, { method: 'PUT', body: updates })

// Promo codes
export const getPromoCodes = () => adminFetch<{ data: any[] }>('/promo-codes')
export const createPromoCode = (code: { code: string; plan_code: string; max_uses: number; permanent?: boolean; expires_at?: string }) =>
  adminFetch('/promo-codes', { method: 'POST', body: code })
export const updatePromoCode = (id: string, updates: Record<string, unknown>) =>
  adminFetch(`/promo-codes/${id}`, { method: 'PUT', body: updates })

// Users
export const getUsers = (params: { search?: string; role?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.role) q.set('role', params.role)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/users?${q}`)
}
export const getUserDetail = (id: string) => adminFetch<{ data: any }>(`/users/${id}`)
export const updateUserSubscription = (id: string, action: Record<string, unknown>) =>
  adminFetch(`/users/${id}/subscription`, { method: 'PUT', body: action })
export const toggleUserAdmin = (id: string, isAdmin: boolean) =>
  adminFetch(`/users/${id}/admin`, { method: 'PUT', body: { is_admin: isAdmin } })

// Subscriptions
export const getSubscriptions = (params: { status?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/subscriptions?${q}`)
}
export const getSubscriptionStats = () => adminFetch<{ data: any }>('/subscriptions/stats')

// Payments
export const getPayments = (params: { status?: string; from?: string; to?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/payments?${q}`)
}

// Activity
export const getActivity = (params: { landlord_id?: string; type?: string; from?: string; to?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.landlord_id) q.set('landlord_id', params.landlord_id)
  if (params.type) q.set('type', params.type)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/activity?${q}`)
}

// Monitoring
export const getNotifications = (params: { status?: string; type?: string; from?: string; to?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.type) q.set('type', params.type)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/notifications?${q}`)
}

export const getBillGeneration = (params: { property_id?: string; from?: string; to?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.property_id) q.set('property_id', params.property_id)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/bill-generation?${q}`)
}

export const getPaymentClaims = (params: { status?: string; from?: string; to?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/payment-claims?${q}`)
}
export const updatePaymentClaim = (id: string, updates: { status: string; reject_reason?: string }) =>
  adminFetch(`/payment-claims/${id}`, { method: 'PUT', body: updates })

export const getCronHealth = () => adminFetch<{ data: any[] }>('/cron-health')

// Audit log
export const getAuditLog = (params: { table?: string; from?: string; to?: string; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.table) q.set('table', params.table)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  if (params.page) q.set('page', String(params.page))
  return adminFetch<{ data: any[]; total: number; page: number; pageSize: number }>(`/audit-log?${q}`)
}
