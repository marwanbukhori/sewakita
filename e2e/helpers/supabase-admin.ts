import { createClient } from '@supabase/supabase-js'
import { TEST_LANDLORD, TEST_TENANT, TEST_PROPERTY, TEST_ROOMS } from '../fixtures/test-data'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function createTestUser(
  email: string,
  password: string,
  role: 'landlord' | 'tenant',
  name: string,
  phone: string
): Promise<string> {
  const { data: { user }, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`)
  if (!user) throw new Error(`No user returned for ${email}`)

  const { error: profileError } = await admin.from('profiles').insert({
    auth_id: user.id,
    role,
    name,
    phone,
    email,
  })
  if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`)

  return user.id
}

export async function seedTestData() {
  // Create users
  const landlordAuthId = await createTestUser(
    TEST_LANDLORD.email, TEST_LANDLORD.password, 'landlord', TEST_LANDLORD.name, TEST_LANDLORD.phone
  )

  // Get landlord profile ID
  const { data: landlordProfile } = await admin.from('profiles')
    .select('id').eq('auth_id', landlordAuthId).single()
  const landlordId = landlordProfile!.id

  const tenantAuthId = await createTestUser(
    TEST_TENANT.email, TEST_TENANT.password, 'tenant', TEST_TENANT.name, TEST_TENANT.phone
  )
  const { data: tenantProfile } = await admin.from('profiles')
    .select('id').eq('auth_id', tenantAuthId).single()
  const tenantId = tenantProfile!.id

  // Create property
  const { data: property, error: propError } = await admin.from('properties').insert({
    landlord_id: landlordId,
    name: TEST_PROPERTY.name,
    address: TEST_PROPERTY.address,
    billing_date: TEST_PROPERTY.billingDate,
    is_active: true,
  }).select().single()
  if (propError) throw new Error(`Failed to create property: ${propError.message}`)

  // Create rooms
  const roomIds: string[] = []
  for (const room of TEST_ROOMS) {
    const { data: roomData, error: roomError } = await admin.from('rooms').insert({
      property_id: property.id,
      label: room.label,
      rent_amount: room.rent,
      status: 'vacant',
      is_active: true,
    }).select().single()
    if (roomError) throw new Error(`Failed to create room: ${roomError.message}`)
    roomIds.push(roomData.id)
  }

  // Assign tenant to Room A
  const { error: tenancyError } = await admin.from('tenancies').insert({
    tenant_id: tenantId,
    room_id: roomIds[0],
    status: 'active',
    agreed_rent: TEST_ROOMS[0].rent,
    deposit: TEST_ROOMS[0].rent * 2,
    move_in: new Date().toISOString().split('T')[0],
  })
  if (tenancyError) throw new Error(`Failed to create tenancy: ${tenancyError.message}`)

  // Update room status to occupied
  await admin.from('rooms').update({ status: 'occupied' }).eq('id', roomIds[0])

  // Seed billing data for previous 2 months
  const now = new Date()
  for (let i = 2; i >= 1; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const month = d.toISOString().slice(0, 7)

    // Utility bills
    await admin.from('utility_bills').insert([
      { property_id: property.id, month, type: 'electric', total_amount: 150 + Math.floor(Math.random() * 50), split_method: 'equal', source: 'manual' },
      { property_id: property.id, month, type: 'water', total_amount: 40 + Math.floor(Math.random() * 30), split_method: 'equal', source: 'manual' },
    ])

    // Monthly bill (paid)
    await admin.from('monthly_bills').insert({
      tenant_id: tenantId,
      room_id: roomIds[0],
      property_id: property.id,
      month,
      rent_amount: TEST_ROOMS[0].rent,
      utility_breakdown: [
        { type: 'electric', amount: 170, split_method: 'equal' },
        { type: 'water', amount: 55, split_method: 'equal' },
      ],
      total_due: TEST_ROOMS[0].rent + 170 + 55,
      total_paid: TEST_ROOMS[0].rent + 170 + 55,
      status: 'paid',
      due_date: `${month}-15`,
    })
  }

  // Seed test promo code
  await admin.from('promo_codes').insert({
    code: 'TESTPROMO',
    plan_code: 'pro_monthly',
    max_uses: 5,
    current_uses: 0,
    permanent: true,
  })

  return { landlordId, tenantId, propertyId: property.id, roomIds }
}

export async function cleanupAll() {
  // Delete in FK order
  const tables = [
    'payments', 'payment_claims', 'monthly_bills', 'utility_bills', 'utility_templates',
    'bill_generation_log', 'activity_log', 'notification_log',
    'rent_agreements', 'subscriptions', 'invites', 'tenancies',
    'payment_settings', 'notification_settings', 'rooms', 'properties', 'profiles',
  ]
  for (const table of tables) {
    await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  // Clean promo codes (keep plans, remove test promos)
  await admin.from('promo_codes').delete().eq('code', 'TESTPROMO')

  // Delete auth users
  const { data: { users } } = await admin.auth.admin.listUsers()
  for (const u of (users || [])) {
    await admin.auth.admin.deleteUser(u.id)
  }
}
