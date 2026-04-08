// Overdue reminder Edge Function
// Runs daily via pg_cron. Finds overdue bills and sends reminder emails
// based on notification_settings.on_overdue (days after due date).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Deno.serve(async (_req) => {
  try {
    // 1. Mark overdue bills
    await supabase.rpc('mark_overdue_bills')

    // 2. Get all notification settings with overdue reminders enabled
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*, property:properties(id, name, landlord_id)')
      .not('on_overdue', 'is', null)
      .eq('email_enabled', true)

    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ message: 'No overdue reminders configured' }))
    }

    let remindersSent = 0

    for (const setting of settings) {
      const daysOverdue = setting.on_overdue
      const property = setting.property

      if (!property || !daysOverdue) continue

      // Find overdue bills for this property
      const { data: overdueBills } = await supabase
        .from('monthly_bills')
        .select('*, tenant:profiles!monthly_bills_tenant_id_fkey(id, name, email), room:rooms(label)')
        .eq('property_id', property.id)
        .eq('status', 'overdue')

      for (const bill of (overdueBills || [])) {
        if (!bill.tenant?.email) continue

        // Check if we already sent a reminder recently (within last 7 days)
        const { data: recentLog } = await supabase
          .from('notification_log')
          .select('id')
          .eq('tenant_id', bill.tenant.id)
          .eq('property_id', property.id)
          .eq('type', 'overdue')
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .limit(1)

        if (recentLog && recentLog.length > 0) continue // Already reminded this week

        const outstanding = bill.total_due - bill.total_paid

        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: bill.tenant.email,
              template: 'overdue',
              language: 'en',
              tenant_id: bill.tenant.id,
              property_id: property.id,
              data: {
                tenant_name: bill.tenant.name,
                property_name: property.name,
                amount: outstanding,
                month: bill.month,
              },
            }),
          })
          remindersSent++
        } catch { /* continue on failure */ }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      reminders_sent: remindersSent,
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})
