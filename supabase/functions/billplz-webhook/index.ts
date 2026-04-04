// Billplz webhook callback handler
// Receives payment confirmation from Billplz

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    // Billplz sends data as form-urlencoded
    const formData = await req.formData()
    const billplzId = formData.get('id') as string
    const paid = formData.get('paid') === 'true'
    const paidAmount = formData.get('paid_amount') as string

    if (!billplzId) {
      return new Response('Missing bill ID', { status: 400 })
    }

    // Find the payment record by gateway_bill_id
    const { data: payment } = await supabase
      .from('payments')
      .select('*, monthly_bill:monthly_bills(*)')
      .eq('gateway_bill_id', billplzId)
      .single()

    if (!payment) {
      return new Response('Payment not found', { status: 404 })
    }

    if (paid) {
      // Update payment record
      await supabase.from('payments').update({
        gateway_status: 'paid',
      }).eq('id', payment.id)

      // Update monthly bill
      const bill = payment.monthly_bill
      if (bill) {
        const newTotalPaid = bill.total_paid + payment.amount
        await supabase.from('monthly_bills').update({
          total_paid: newTotalPaid,
          status: newTotalPaid >= bill.total_due ? 'paid' : 'partial',
        }).eq('id', bill.id)

        // Get property for landlord_id
        const { data: property } = await supabase
          .from('properties')
          .select('landlord_id, name')
          .eq('id', bill.property_id)
          .single()

        // Create activity log + send receipt email
        if (property) {
          await supabase.from('activity_log').insert({
            landlord_id: property.landlord_id,
            type: 'payment_received',
            title: `Payment received: RM${payment.amount}`,
            detail: `${property.name} — Online payment via Billplz`,
            related_id: payment.id,
          })

          // Send receipt email to tenant
          const { data: tenant } = await supabase
            .from('profiles').select('name, email').eq('id', bill.tenant_id).single()
          const { data: room } = await supabase
            .from('rooms').select('label').eq('id', bill.room_id).single()

          if (tenant?.email) {
            const { data: notifSettings } = await supabase
              .from('notification_settings').select('email_enabled, on_payment_received')
              .eq('property_id', bill.property_id).single()

            if (!notifSettings || (notifSettings.email_enabled && notifSettings.on_payment_received)) {
              try {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    to: tenant.email,
                    template: 'receipt',
                    language: 'en',
                    tenant_id: bill.tenant_id,
                    property_id: bill.property_id,
                    data: {
                      tenant_name: tenant.name,
                      property_name: property.name,
                      room_label: room?.label,
                      month: bill.month,
                      amount: payment.amount,
                      status: newTotalPaid >= bill.total_due ? 'paid' : 'partial',
                    },
                  }),
                })
              } catch { /* don't block on email failure */ }
            }
          }
        }
      }
    } else {
      // Payment failed or cancelled
      await supabase.from('payments').update({
        gateway_status: 'failed',
      }).eq('id', payment.id)
    }

    return new Response('OK')
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})
