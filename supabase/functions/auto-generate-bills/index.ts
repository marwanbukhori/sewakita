// Auto-generate monthly bills Edge Function
// Deploy: supabase functions deploy auto-generate-bills
// Schedule via pg_cron: SELECT cron.schedule('auto-bills', '0 0 * * *', 'SELECT net.http_post(...)');
//
// This function runs daily and generates bills for properties
// where today matches the property's billing_date.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  try {
    const today = new Date()
    const dayOfMonth = today.getDate()
    const currentMonth = today.toISOString().slice(0, 7) // YYYY-MM

    // 1. Mark overdue bills from previous months
    await supabase.rpc('mark_overdue_bills')

    // 2. Find properties where billing_date = today
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*, rooms(*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*)))')
      .eq('billing_date', dayOfMonth)
      .eq('is_active', true)

    if (propError) throw propError
    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ message: 'No properties to bill today', day: dayOfMonth }))
    }

    let totalBillsCreated = 0

    for (const property of properties) {
      // Check if bills already exist for this month
      const { data: existingBills } = await supabase
        .from('monthly_bills')
        .select('id')
        .eq('property_id', property.id)
        .eq('month', currentMonth)
        .limit(1)

      if (existingBills && existingBills.length > 0) continue // Already generated

      // Load utility templates
      const { data: templates } = await supabase
        .from('utility_templates')
        .select('*')
        .eq('property_id', property.id)
        .eq('is_active', true)

      // Load utility bills for this month (may have been manually entered)
      const { data: utilityBills } = await supabase
        .from('utility_bills')
        .select('*')
        .eq('property_id', property.id)
        .eq('month', currentMonth)

      // Use utility bills if they exist, otherwise use templates
      const utilities = (utilityBills && utilityBills.length > 0)
        ? utilityBills
        : (templates || []).map((t: any) => ({
            type: t.type,
            total_amount: t.default_amount || 0,
            split_method: t.split_method,
            fixed_amount_per_room: t.fixed_amount_per_room,
            per_room_readings: null,
          }))

      const occupiedRooms = (property.rooms || []).filter((r: any) =>
        r.status === 'occupied' && r.is_active
      )

      let billsCreated = 0

      for (const room of occupiedRooms) {
        const activeTenancy = (room.tenancies || []).find((t: any) => t.status === 'active')
        if (!activeTenancy) continue

        // Calculate rent (prorate for move-in month)
        const moveInDate = new Date(activeTenancy.move_in)
        const billMonth = new Date(currentMonth + '-01')
        let rentAmount = activeTenancy.agreed_rent

        if (moveInDate.getFullYear() === billMonth.getFullYear() &&
            moveInDate.getMonth() === billMonth.getMonth()) {
          const daysInMonth = new Date(billMonth.getFullYear(), billMonth.getMonth() + 1, 0).getDate()
          const remainingDays = daysInMonth - moveInDate.getDate() + 1
          rentAmount = Math.round((activeTenancy.agreed_rent * remainingDays) / daysInMonth)
        }

        // Calculate utility charges
        const utilityBreakdown = utilities.map((ub: any) => {
          let amount = 0
          if (ub.split_method === 'absorbed') amount = 0
          else if (ub.split_method === 'equal') amount = Math.round(ub.total_amount / occupiedRooms.length)
          else if (ub.split_method === 'fixed') amount = ub.fixed_amount_per_room || 0
          else if (ub.split_method === 'sub_meter' && ub.per_room_readings) {
            const totalReadings = ub.per_room_readings.reduce((s: number, r: any) => s + r.reading, 0)
            const roomReading = ub.per_room_readings.find((r: any) => r.room_id === room.id)
            if (roomReading && totalReadings > 0) amount = Math.round((roomReading.reading / totalReadings) * ub.total_amount)
          }
          return { type: ub.type, amount, split_method: ub.split_method }
        })

        const totalDue = rentAmount + utilityBreakdown.reduce((s: number, u: any) => s + u.amount, 0)

        const { error: insertError } = await supabase.from('monthly_bills').insert({
          tenant_id: activeTenancy.tenant_id,
          room_id: room.id,
          property_id: property.id,
          month: currentMonth,
          rent_amount: rentAmount,
          utility_breakdown: utilityBreakdown,
          total_due: totalDue,
          total_paid: 0,
          status: 'pending',
        })

        if (!insertError) billsCreated++
      }

      // Log generation
      if (billsCreated > 0) {
        await supabase.from('bill_generation_log').insert({
          property_id: property.id,
          month: currentMonth,
          bills_created: billsCreated,
          triggered_by: 'auto',
        })

        // Create activity log
        await supabase.from('activity_log').insert({
          landlord_id: property.landlord_id,
          type: 'bill_generated',
          title: `Bills auto-generated for ${property.name}`,
          detail: `${billsCreated} bill(s) for ${currentMonth}`,
          related_id: property.id,
        })
      }

      totalBillsCreated += billsCreated
    }

    return new Response(JSON.stringify({
      success: true,
      properties_processed: properties.length,
      total_bills_created: totalBillsCreated,
      month: currentMonth,
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})
