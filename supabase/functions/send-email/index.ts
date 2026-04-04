// Email notification sender via Resend
// Deploy: supabase functions deploy send-email
// Requires RESEND_API_KEY environment variable

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'SewaKita <noreply@sewakita.app>'

interface EmailRequest {
  to: string
  template: 'bill' | 'receipt' | 'overdue' | 'agreement' | 'welcome' | 'report'
  data: Record<string, any>
  language: 'en' | 'ms'
  tenant_id: string
  property_id: string
}

const TEMPLATES: Record<string, Record<string, { subject: string; body: (data: any) => string }>> = {
  bill: {
    en: {
      subject: 'Your Monthly Bill — {{month}}',
      body: (d) => `
        <h2>Monthly Bill for ${d.month}</h2>
        <p>Hi ${d.tenant_name},</p>
        <p>Your bill for <strong>${d.property_name}</strong> (${d.room_label}) is ready.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Room Rent</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">RM${d.rent_amount}</td></tr>
          ${(d.utilities || []).map((u: any) => u.amount > 0 ? `<tr><td style="padding:8px;border-bottom:1px solid #eee">${u.type}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">RM${u.amount}</td></tr>` : '').join('')}
          <tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;font-weight:bold;text-align:right">RM${d.total_due}</td></tr>
        </table>
        <p>Please make your payment by day ${d.payment_due_day} of the month.</p>
        <p>— SewaKita</p>
      `,
    },
    ms: {
      subject: 'Bil Bulanan Anda — {{month}}',
      body: (d) => `
        <h2>Bil Bulanan ${d.month}</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Bil anda untuk <strong>${d.property_name}</strong> (${d.room_label}) telah sedia.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Sewa Bilik</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">RM${d.rent_amount}</td></tr>
          ${(d.utilities || []).map((u: any) => u.amount > 0 ? `<tr><td style="padding:8px;border-bottom:1px solid #eee">${u.type === 'electric' ? 'Elektrik' : u.type === 'water' ? 'Air' : 'Internet'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">RM${u.amount}</td></tr>` : '').join('')}
          <tr><td style="padding:8px;font-weight:bold">Jumlah</td><td style="padding:8px;font-weight:bold;text-align:right">RM${d.total_due}</td></tr>
        </table>
        <p>Sila jelaskan bayaran sebelum hari ${d.payment_due_day} setiap bulan.</p>
        <p>— SewaKita</p>
      `,
    },
  },
  receipt: {
    en: {
      subject: 'Payment Received — RM{{amount}}',
      body: (d) => `
        <h2>Payment Confirmation</h2>
        <p>Hi ${d.tenant_name},</p>
        <p>We've received your payment of <strong>RM${d.amount}</strong> for ${d.property_name} (${d.room_label}).</p>
        <p>Month: ${d.month}<br>Status: ${d.status === 'paid' ? 'Fully Paid' : 'Partial'}</p>
        <p>Thank you!</p>
        <p>— SewaKita</p>
      `,
    },
    ms: {
      subject: 'Bayaran Diterima — RM{{amount}}',
      body: (d) => `
        <h2>Pengesahan Bayaran</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Bayaran sebanyak <strong>RM${d.amount}</strong> untuk ${d.property_name} (${d.room_label}) telah diterima.</p>
        <p>Bulan: ${d.month}<br>Status: ${d.status === 'paid' ? 'Selesai' : 'Separa'}</p>
        <p>Terima kasih!</p>
        <p>— SewaKita</p>
      `,
    },
  },
  overdue: {
    en: {
      subject: 'Payment Reminder — RM{{amount}} Outstanding',
      body: (d) => `
        <h2>Payment Reminder</h2>
        <p>Hi ${d.tenant_name},</p>
        <p>This is a friendly reminder that your rent payment of <strong>RM${d.amount}</strong> for ${d.property_name} is overdue.</p>
        <p>Please make your payment as soon as possible.</p>
        <p>— SewaKita</p>
      `,
    },
    ms: {
      subject: 'Peringatan Bayaran — RM{{amount}} Tertunggak',
      body: (d) => `
        <h2>Peringatan Bayaran</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Ini adalah peringatan mesra bahawa bayaran sewa sebanyak <strong>RM${d.amount}</strong> untuk ${d.property_name} masih tertunggak.</p>
        <p>Mohon jelaskan bayaran secepat mungkin.</p>
        <p>— SewaKita</p>
      `,
    },
  },
  welcome: {
    en: {
      subject: 'Welcome to SewaKita!',
      body: (d) => `
        <h2>Welcome to SewaKita</h2>
        <p>Hi ${d.tenant_name},</p>
        <p>You've been registered as a tenant at <strong>${d.property_name}</strong> (${d.room_label}).</p>
        <p>You can now view your bills, track payments, and manage your tenancy through SewaKita.</p>
        <p>— SewaKita</p>
      `,
    },
    ms: {
      subject: 'Selamat Datang ke SewaKita!',
      body: (d) => `
        <h2>Selamat Datang ke SewaKita</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Anda telah didaftarkan sebagai penyewa di <strong>${d.property_name}</strong> (${d.room_label}).</p>
        <p>Anda kini boleh melihat bil, menjejaki bayaran, dan mengurus penyewaan anda melalui SewaKita.</p>
        <p>— SewaKita</p>
      `,
    },
  },
  report: {
    en: {
      subject: '[SewaKita Report] {{category}}: {{subject}}',
      body: (d) => `
        <h2>User Report</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:120px">From</td><td style="padding:8px;border-bottom:1px solid #eee">${d.user_name} (${d.user_email})</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Role</td><td style="padding:8px;border-bottom:1px solid #eee">${d.user_role}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Category</td><td style="padding:8px;border-bottom:1px solid #eee">${d.category}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Subject</td><td style="padding:8px;border-bottom:1px solid #eee">${d.subject}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Time</td><td style="padding:8px;border-bottom:1px solid #eee">${d.timestamp}</td></tr>
        </table>
        <h3>Description</h3>
        <p style="white-space:pre-wrap;background:#f7f7f7;padding:16px;border-radius:8px">${d.description}</p>
      `,
    },
    ms: {
      subject: '[SewaKita Laporan] {{category}}: {{subject}}',
      body: (d) => `
        <h2>Laporan Pengguna</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:120px">Dari</td><td style="padding:8px;border-bottom:1px solid #eee">${d.user_name} (${d.user_email})</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Peranan</td><td style="padding:8px;border-bottom:1px solid #eee">${d.user_role}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Kategori</td><td style="padding:8px;border-bottom:1px solid #eee">${d.category}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Subjek</td><td style="padding:8px;border-bottom:1px solid #eee">${d.subject}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Masa</td><td style="padding:8px;border-bottom:1px solid #eee">${d.timestamp}</td></tr>
        </table>
        <h3>Penerangan</h3>
        <p style="white-space:pre-wrap;background:#f7f7f7;padding:16px;border-radius:8px">${d.description}</p>
      `,
    },
  },
  agreement: {
    en: {
      subject: 'Rental Agreement Ready for Review',
      body: (d) => `
        <h2>Rental Agreement</h2>
        <p>Hi ${d.tenant_name},</p>
        <p>A rental agreement for <strong>${d.property_name}</strong> (${d.room_label}) is ready for your review.</p>
        <p>Please log in to SewaKita to review and accept the agreement.</p>
        <p>— SewaKita</p>
      `,
    },
    ms: {
      subject: 'Perjanjian Sewa Sedia untuk Semakan',
      body: (d) => `
        <h2>Perjanjian Sewa</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Perjanjian sewa untuk <strong>${d.property_name}</strong> (${d.room_label}) sedia untuk semakan anda.</p>
        <p>Sila log masuk ke SewaKita untuk menyemak dan menerima perjanjian.</p>
        <p>— SewaKita</p>
      `,
    },
  },
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { to, template, data, language, tenant_id, property_id }: EmailRequest = await req.json()

    const tmpl = TEMPLATES[template]?.[language] || TEMPLATES[template]?.['en']
    if (!tmpl) {
      return new Response(JSON.stringify({ error: 'Unknown template' }), { status: 400 })
    }

    let subject = tmpl.subject
    // Replace placeholders in subject
    Object.entries(data).forEach(([key, value]) => {
      subject = subject.replace(`{{${key}}}`, String(value))
    })

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#2D333A">
        ${tmpl.body(data)}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="font-size:12px;color:#999">This email was sent by SewaKita. Do not reply to this email.</p>
      </div>
    `

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })

    const result = await response.json()
    const status = response.ok ? 'sent' : 'failed'

    // Log notification
    await supabase.from('notification_log').insert({
      tenant_id,
      property_id,
      channel: 'email',
      type: template,
      status,
      detail: { subject, to, resend_id: result.id || null, error: result.message || null },
    })

    return new Response(JSON.stringify({ success: response.ok, id: result.id }))
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})
