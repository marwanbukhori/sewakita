// Admin API — single edge function with path-based routing.
// All routes require admin auth. Uses service_role client for cross-landlord access.
// Deploy: supabase functions deploy admin-api
//
// Routes:
//   GET/PUT  /config, /config/:key
//   GET/PUT  /flags, /flags/:key
//   GET/PUT  /plans, /plans/:code
//   GET/POST/PUT /promo-codes, /promo-codes/:id
//   GET/PUT  /users, /users/:id, /users/:id/subscription, /users/:id/admin
//   GET      /subscriptions, /subscriptions/stats
//   GET      /payments
//   GET      /activity
//   GET      /notifications
//   GET      /bill-generation
//   GET/PUT  /payment-claims, /payment-claims/:id
//   GET      /cron-health
//   GET      /audit-log

import { verifyAdmin, adminClient, type AdminUser } from '../_shared/admin-auth.ts'
import { corsResponse, jsonResponse, errorResponse, corsHeaders } from '../_shared/cors.ts'

const PAGE_SIZE = 20

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPath(req: Request): string {
  const url = new URL(req.url)
  // Edge function path: /admin-api/... → extract after /admin-api
  const full = url.pathname
  const idx = full.indexOf('/admin-api')
  return idx >= 0 ? full.slice(idx + '/admin-api'.length) || '/' : full
}

function getQuery(req: Request): URLSearchParams {
  return new URL(req.url).searchParams
}

function pageParams(req: Request): { page: number; offset: number } {
  const page = Math.max(1, parseInt(getQuery(req).get('page') || '1'))
  return { page, offset: (page - 1) * PAGE_SIZE }
}

async function auditLog(
  tableName: string,
  recordKey: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
  changedBy: string
) {
  await adminClient.from('config_audit_log').insert({
    table_name: tableName,
    record_key: recordKey,
    action,
    old_value: oldValue,
    new_value: newValue,
    changed_by: changedBy,
  })
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleConfig(req: Request, path: string, admin: AdminUser) {
  if (req.method === 'GET' && path === '/config') {
    const { data, error } = await adminClient
      .from('site_config')
      .select('*')
      .order('category')
      .order('key')
    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true, data })
  }

  // PUT /config/:key
  const configMatch = path.match(/^\/config\/(.+)$/)
  if (req.method === 'PUT' && configMatch) {
    const key = decodeURIComponent(configMatch[1])
    const body = await req.json()

    // Get old value
    const { data: old } = await adminClient
      .from('site_config')
      .select('*')
      .eq('key', key)
      .single()
    if (!old) return errorResponse(`Config key '${key}' not found`, 404)

    const { error } = await adminClient
      .from('site_config')
      .update({ value: body.value, description: body.description ?? old.description, updated_at: new Date().toISOString(), updated_by: admin.profileId })
      .eq('key', key)
    if (error) return errorResponse(error.message, 500)

    await auditLog('site_config', key, 'update', old.value, body.value, admin.profileId)
    return jsonResponse({ success: true })
  }

  // POST /config — create new entry
  if (req.method === 'POST' && path === '/config') {
    const body = await req.json()
    if (!body.key || body.value === undefined || !body.category) {
      return errorResponse('key, value, and category are required')
    }
    const { error } = await adminClient.from('site_config').insert({
      key: body.key,
      value: body.value,
      description: body.description || null,
      category: body.category,
      updated_by: admin.profileId,
    })
    if (error) return errorResponse(error.message, 500)
    await auditLog('site_config', body.key, 'create', null, body.value, admin.profileId)
    return jsonResponse({ success: true }, 201)
  }

  return null
}

async function handleFlags(req: Request, path: string, admin: AdminUser) {
  if (req.method === 'GET' && path === '/flags') {
    const { data, error } = await adminClient
      .from('feature_flags')
      .select('*')
      .order('tier')
      .order('key')
    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true, data })
  }

  const flagMatch = path.match(/^\/flags\/(.+)$/)
  if (req.method === 'PUT' && flagMatch) {
    const key = decodeURIComponent(flagMatch[1])
    const body = await req.json()

    const { data: old } = await adminClient
      .from('feature_flags')
      .select('*')
      .eq('key', key)
      .single()
    if (!old) return errorResponse(`Flag '${key}' not found`, 404)

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.enabled !== undefined) updates.enabled = body.enabled
    if (body.tier !== undefined) updates.tier = body.tier
    if (body.description !== undefined) updates.description = body.description

    const { error } = await adminClient.from('feature_flags').update(updates).eq('key', key)
    if (error) return errorResponse(error.message, 500)

    await auditLog('feature_flags', key, 'update',
      { enabled: old.enabled, tier: old.tier },
      { enabled: updates.enabled ?? old.enabled, tier: updates.tier ?? old.tier },
      admin.profileId
    )
    return jsonResponse({ success: true })
  }

  return null
}

async function handlePlans(req: Request, path: string, admin: AdminUser) {
  if (req.method === 'GET' && path === '/plans') {
    // Get plans with subscriber counts
    const { data: plans, error } = await adminClient
      .from('plans')
      .select('*')
      .order('sort_order')

    if (error) return errorResponse(error.message, 500)

    // Get subscriber counts per plan
    const { data: counts } = await adminClient
      .from('subscriptions')
      .select('plan_code')
      .in('status', ['active', 'past_due'])

    const countMap: Record<string, number> = {}
    for (const row of counts || []) {
      countMap[row.plan_code] = (countMap[row.plan_code] || 0) + 1
    }

    const result = (plans || []).map(p => ({
      ...p,
      subscriber_count: countMap[p.code] || 0,
    }))

    return jsonResponse({ success: true, data: result })
  }

  const planMatch = path.match(/^\/plans\/(.+)$/)
  if (req.method === 'PUT' && planMatch) {
    const code = decodeURIComponent(planMatch[1])
    const body = await req.json()

    const { data: old } = await adminClient.from('plans').select('*').eq('code', code).single()
    if (!old) return errorResponse(`Plan '${code}' not found`, 404)

    const updates: Record<string, unknown> = {}
    if (body.display_name !== undefined) updates.display_name = body.display_name
    if (body.price_myr !== undefined) updates.price_myr = body.price_myr
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order

    const { error } = await adminClient.from('plans').update(updates).eq('code', code)
    if (error) return errorResponse(error.message, 500)

    await auditLog('plans', code, 'update', old, { ...old, ...updates }, admin.profileId)
    return jsonResponse({ success: true })
  }

  return null
}

async function handlePromoCodes(req: Request, path: string, admin: AdminUser) {
  if (req.method === 'GET' && path === '/promo-codes') {
    const { data, error } = await adminClient
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true, data })
  }

  if (req.method === 'POST' && path === '/promo-codes') {
    const body = await req.json()
    if (!body.code || !body.plan_code || !body.max_uses) {
      return errorResponse('code, plan_code, and max_uses are required')
    }
    const { data, error } = await adminClient.from('promo_codes').insert({
      code: body.code.toUpperCase(),
      plan_code: body.plan_code,
      max_uses: body.max_uses,
      permanent: body.permanent ?? false,
      expires_at: body.expires_at || null,
    }).select().single()
    if (error) return errorResponse(error.message, 500)

    await auditLog('promo_codes', body.code.toUpperCase(), 'create', null, data, admin.profileId)
    return jsonResponse({ success: true, data }, 201)
  }

  const promoMatch = path.match(/^\/promo-codes\/(.+)$/)
  if (req.method === 'PUT' && promoMatch) {
    const id = promoMatch[1]
    const body = await req.json()

    const { data: old } = await adminClient.from('promo_codes').select('*').eq('id', id).single()
    if (!old) return errorResponse('Promo code not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.max_uses !== undefined) updates.max_uses = body.max_uses
    if (body.permanent !== undefined) updates.permanent = body.permanent
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at

    const { error } = await adminClient.from('promo_codes').update(updates).eq('id', id)
    if (error) return errorResponse(error.message, 500)

    await auditLog('promo_codes', old.code, 'update', old, { ...old, ...updates }, admin.profileId)
    return jsonResponse({ success: true })
  }

  return null
}

async function handleUsers(req: Request, path: string, admin: AdminUser) {
  // GET /users?search=&role=&page=
  if (req.method === 'GET' && path === '/users') {
    const q = getQuery(req)
    const search = q.get('search') || ''
    const role = q.get('role') || ''
    const { page, offset } = pageParams(req)

    let query = adminClient.from('profiles').select('*', { count: 'exact' })
    if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    if (role) query = query.eq('role', role)

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
  }

  // PUT /users/:id/admin
  const adminToggle = path.match(/^\/users\/([^/]+)\/admin$/)
  if (req.method === 'PUT' && adminToggle) {
    const id = adminToggle[1]
    const body = await req.json()
    const { error } = await adminClient
      .from('profiles')
      .update({ is_admin: body.is_admin })
      .eq('id', id)
    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true })
  }

  // PUT /users/:id/subscription
  const subAction = path.match(/^\/users\/([^/]+)\/subscription$/)
  if (req.method === 'PUT' && subAction) {
    const id = subAction[1]
    const body = await req.json()

    if (body.action === 'extend' && body.period_end) {
      const { error } = await adminClient
        .from('subscriptions')
        .update({ period_end: body.period_end, updated_at: new Date().toISOString() })
        .eq('landlord_id', id)
        .in('status', ['active', 'past_due'])
      if (error) return errorResponse(error.message, 500)
      return jsonResponse({ success: true })
    }

    if (body.action === 'cancel') {
      const { error } = await adminClient
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('landlord_id', id)
        .in('status', ['active', 'past_due'])
      if (error) return errorResponse(error.message, 500)
      return jsonResponse({ success: true })
    }

    return errorResponse('Invalid action. Use "extend" or "cancel".')
  }

  // GET /users/:id — full detail
  const userDetail = path.match(/^\/users\/([^/]+)$/)
  if (req.method === 'GET' && userDetail) {
    const id = userDetail[1]

    const [profileRes, subRes, propsRes, paymentsRes, activityRes] = await Promise.all([
      adminClient.from('profiles').select('*').eq('id', id).single(),
      adminClient.from('subscriptions').select('*, plan:plans(*)').eq('landlord_id', id).order('created_at', { ascending: false }).limit(1),
      adminClient.from('properties').select('id, name, address, created_at, rooms(id, name, rent_amount, status)').eq('landlord_id', id),
      adminClient.from('payments').select('*, bill:monthly_bills(month, property:properties(name))').order('created_at', { ascending: false }).limit(20),
      adminClient.from('activity_log').select('*').eq('landlord_id', id).order('created_at', { ascending: false }).limit(20),
    ])

    if (profileRes.error) return errorResponse(profileRes.error.message, 500)

    return jsonResponse({
      success: true,
      data: {
        profile: profileRes.data,
        subscription: subRes.data?.[0] || null,
        properties: propsRes.data || [],
        payments: paymentsRes.data || [],
        activity: activityRes.data || [],
      },
    })
  }

  return null
}

async function handleSubscriptions(req: Request, path: string) {
  // GET /subscriptions/stats
  if (req.method === 'GET' && path === '/subscriptions/stats') {
    const { data: subs } = await adminClient
      .from('subscriptions')
      .select('status, plan:plans(price_myr, billing_interval)')

    const stats = { active: 0, past_due: 0, expired: 0, cancelled: 0, mrr: 0 }
    for (const s of subs || []) {
      const status = s.status as keyof typeof stats
      if (status in stats && status !== 'mrr') stats[status]++
      if (s.status === 'active' && (s as any).plan?.billing_interval === 'monthly') {
        stats.mrr += parseFloat((s as any).plan?.price_myr || '0')
      }
    }

    // Total revenue from completed payments
    const { data: rev } = await adminClient
      .from('payments')
      .select('amount')
      .eq('gateway_status', 'paid')
    const totalRevenue = (rev || []).reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)

    // Total landlords and tenants
    const { count: landlordCount } = await adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'landlord')
    const { count: tenantCount } = await adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tenant')
    const { count: propertyCount } = await adminClient.from('properties').select('*', { count: 'exact', head: true })

    return jsonResponse({
      success: true,
      data: { ...stats, totalRevenue, landlordCount, tenantCount, propertyCount },
    })
  }

  // GET /subscriptions?status=&page=
  if (req.method === 'GET' && path === '/subscriptions') {
    const q = getQuery(req)
    const status = q.get('status') || ''
    const { page, offset } = pageParams(req)

    let query = adminClient
      .from('subscriptions')
      .select('*, plan:plans(*), landlord:profiles!subscriptions_landlord_id_fkey(id, name, email)', { count: 'exact' })

    if (status) query = query.eq('status', status)

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
  }

  return null
}

async function handlePayments(req: Request, path: string) {
  if (req.method !== 'GET' || path !== '/payments') return null

  const q = getQuery(req)
  const status = q.get('status') || ''
  const from = q.get('from') || ''
  const to = q.get('to') || ''
  const { page, offset } = pageParams(req)

  let query = adminClient
    .from('payments')
    .select('*, bill:monthly_bills(month, property:properties(name, landlord:profiles!properties_landlord_id_fkey(name, email)))', { count: 'exact' })

  if (status) query = query.eq('gateway_status', status)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, count, error } = await query
    .order('date', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) return errorResponse(error.message, 500)
  return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
}

async function handleActivity(req: Request, path: string) {
  if (req.method !== 'GET' || path !== '/activity') return null

  const q = getQuery(req)
  const landlordId = q.get('landlord_id') || ''
  const type = q.get('type') || ''
  const from = q.get('from') || ''
  const to = q.get('to') || ''
  const { page, offset } = pageParams(req)

  let query = adminClient
    .from('activity_log')
    .select('*, landlord:profiles!activity_log_landlord_id_fkey(name, email)', { count: 'exact' })

  if (landlordId) query = query.eq('landlord_id', landlordId)
  if (type) query = query.eq('type', type)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) return errorResponse(error.message, 500)
  return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
}

async function handleNotifications(req: Request, path: string) {
  if (req.method !== 'GET' || path !== '/notifications') return null

  const q = getQuery(req)
  const status = q.get('status') || ''
  const type = q.get('type') || ''
  const from = q.get('from') || ''
  const to = q.get('to') || ''
  const { page, offset } = pageParams(req)

  let query = adminClient
    .from('notification_log')
    .select('*', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) return errorResponse(error.message, 500)
  return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
}

async function handleBillGeneration(req: Request, path: string) {
  if (req.method !== 'GET' || path !== '/bill-generation') return null

  const q = getQuery(req)
  const propertyId = q.get('property_id') || ''
  const from = q.get('from') || ''
  const to = q.get('to') || ''
  const { page, offset } = pageParams(req)

  let query = adminClient
    .from('bill_generation_log')
    .select('*, property:properties(name)', { count: 'exact' })

  if (propertyId) query = query.eq('property_id', propertyId)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) return errorResponse(error.message, 500)
  return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
}

async function handlePaymentClaims(req: Request, path: string, admin: AdminUser) {
  // GET /payment-claims
  if (req.method === 'GET' && path === '/payment-claims') {
    const q = getQuery(req)
    const status = q.get('status') || ''
    const from = q.get('from') || ''
    const to = q.get('to') || ''
    const { page, offset } = pageParams(req)

    let query = adminClient
      .from('payment_claims')
      .select('*, tenant:profiles!payment_claims_tenant_id_fkey(name, email), bill:monthly_bills(month, property:properties(name, landlord:profiles!properties_landlord_id_fkey(name, email)))', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
  }

  // PUT /payment-claims/:id
  const claimMatch = path.match(/^\/payment-claims\/(.+)$/)
  if (req.method === 'PUT' && claimMatch) {
    const id = claimMatch[1]
    const body = await req.json()
    if (!['approved', 'rejected'].includes(body.status)) {
      return errorResponse('status must be "approved" or "rejected"')
    }
    const updates: Record<string, unknown> = {
      status: body.status,
      reviewed_by: admin.profileId,
      reviewed_at: new Date().toISOString(),
    }
    if (body.reject_reason) updates.reject_reason = body.reject_reason

    const { error } = await adminClient.from('payment_claims').update(updates).eq('id', id)
    if (error) return errorResponse(error.message, 500)
    return jsonResponse({ success: true })
  }

  return null
}

async function handleCronHealth(req: Request, path: string) {
  if (req.method !== 'GET' || path !== '/cron-health') return null

  // cron_run_log may not exist yet (Phase 7), handle gracefully
  const { data, error } = await adminClient
    .from('cron_run_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10)

  if (error) {
    // Table doesn't exist yet — return placeholder
    return jsonResponse({
      success: true,
      data: [],
      note: 'cron_run_log table not yet created (Phase 7)',
    })
  }

  // Group by function_name, take latest per function
  const latest: Record<string, unknown> = {}
  for (const row of data || []) {
    const fn = (row as any).function_name
    if (!latest[fn]) latest[fn] = row
  }

  return jsonResponse({ success: true, data: Object.values(latest) })
}

async function handleAuditLog(req: Request, path: string) {
  if (req.method !== 'GET' || path !== '/audit-log') return null

  const q = getQuery(req)
  const table = q.get('table') || ''
  const from = q.get('from') || ''
  const to = q.get('to') || ''
  const { page, offset } = pageParams(req)

  let query = adminClient
    .from('config_audit_log')
    .select('*, changed_by_profile:profiles!config_audit_log_changed_by_fkey(name, email)', { count: 'exact' })

  if (table) query = query.eq('table_name', table)
  if (from) query = query.gte('changed_at', from)
  if (to) query = query.lte('changed_at', to)

  const { data, count, error } = await query
    .order('changed_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) return errorResponse(error.message, 500)
  return jsonResponse({ success: true, data, total: count, page, pageSize: PAGE_SIZE })
}

// ---------------------------------------------------------------------------
// Main router
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    // Authenticate admin
    const adminOrResponse = await verifyAdmin(req)
    if (adminOrResponse instanceof Response) return adminOrResponse
    const admin = adminOrResponse

    const path = getPath(req)

    // Route to handler
    const handlers = [
      () => handleConfig(req, path, admin),
      () => handleFlags(req, path, admin),
      () => handlePlans(req, path, admin),
      () => handlePromoCodes(req, path, admin),
      () => handleUsers(req, path, admin),
      () => handleSubscriptions(req, path),
      () => handlePayments(req, path),
      () => handleActivity(req, path),
      () => handleNotifications(req, path),
      () => handleBillGeneration(req, path),
      () => handlePaymentClaims(req, path, admin),
      () => handleCronHealth(req, path),
      () => handleAuditLog(req, path),
    ]

    for (const handler of handlers) {
      const response = await handler()
      if (response) return response
    }

    return errorResponse(`Not found: ${req.method} ${path}`, 404)
  } catch (err) {
    console.error('admin-api error:', err)
    return errorResponse('Internal server error', 500)
  }
})
