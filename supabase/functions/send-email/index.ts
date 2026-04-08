// Email notification sender via Resend
// Deploy: supabase functions deploy send-email
// Requires RESEND_API_KEY environment variable

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'ReRumah <noreply@rerumah.my>'

interface EmailRequest {
  to: string
  template: 'bill' | 'receipt' | 'overdue' | 'agreement' | 'welcome' | 'report'
    | 'subscription-renewal' | 'subscription-dunning' | 'subscription-expired' | 'subscription-annual-reminder'
  data: Record<string, any>
  language: 'en' | 'ms'
  tenant_id?: string
  property_id?: string
  landlord_id?: string
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
        <p>— ReRumah</p>
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
        <p>— ReRumah</p>
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
        <p>— ReRumah</p>
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
        <p>— ReRumah</p>
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
        <p>— ReRumah</p>
      `,
    },
    ms: {
      subject: 'Peringatan Bayaran — RM{{amount}} Tertunggak',
      body: (d) => `
        <h2>Peringatan Bayaran</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Ini adalah peringatan mesra bahawa bayaran sewa sebanyak <strong>RM${d.amount}</strong> untuk ${d.property_name} masih tertunggak.</p>
        <p>Mohon jelaskan bayaran secepat mungkin.</p>
        <p>— ReRumah</p>
      `,
    },
  },
  welcome: {
    en: {
      subject: 'Welcome to ReRumah!',
      body: (d) => `
        <h2>Welcome to ReRumah</h2>
        <p>Hi ${d.tenant_name},</p>
        <p>You've been registered as a tenant at <strong>${d.property_name}</strong> (${d.room_label}).</p>
        <p>You can now view your bills, track payments, and manage your tenancy through ReRumah.</p>
        <p>— ReRumah</p>
      `,
    },
    ms: {
      subject: 'Selamat Datang ke ReRumah!',
      body: (d) => `
        <h2>Selamat Datang ke ReRumah</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Anda telah didaftarkan sebagai penyewa di <strong>${d.property_name}</strong> (${d.room_label}).</p>
        <p>Anda kini boleh melihat bil, menjejaki bayaran, dan mengurus penyewaan anda melalui ReRumah.</p>
        <p>— ReRumah</p>
      `,
    },
  },
  report: {
    en: {
      subject: '[ReRumah Report] {{category}}: {{subject}}',
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
      subject: '[ReRumah Laporan] {{category}}: {{subject}}',
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
        <p>Please log in to ReRumah to review and accept the agreement.</p>
        <p>— ReRumah</p>
      `,
    },
    ms: {
      subject: 'Perjanjian Sewa Sedia untuk Semakan',
      body: (d) => `
        <h2>Perjanjian Sewa</h2>
        <p>Assalamualaikum ${d.tenant_name},</p>
        <p>Perjanjian sewa untuk <strong>${d.property_name}</strong> (${d.room_label}) sedia untuk semakan anda.</p>
        <p>Sila log masuk ke ReRumah untuk menyemak dan menerima perjanjian.</p>
        <p>— ReRumah</p>
      `,
    },
  },
  'subscription-renewal': {
    en: {
      subject: 'ReRumah — Time to renew your subscription',
      body: (d) => `
        <h2>Your subscription is up for renewal</h2>
        <p>Hi ${d.landlord_name},</p>
        <p>Your monthly ReRumah subscription (<strong>RM ${d.amount}</strong>) is ready to renew.</p>
        <p><a href="${d.payment_url}" style="display:inline-block;padding:10px 20px;background:#1e5ab8;color:#fff;border-radius:8px;text-decoration:none;margin:12px 0">Pay Now</a></p>
        <p>If you don't renew within 14 days, your account will be switched to the Free plan.</p>
        <p>— ReRumah</p>
      `,
    },
    ms: {
      subject: 'ReRumah — Masa untuk perbaharui langganan anda',
      body: (d) => `
        <h2>Langganan anda perlu diperbaharui</h2>
        <p>Assalamualaikum ${d.landlord_name},</p>
        <p>Langganan ReRumah bulanan anda (<strong>RM ${d.amount}</strong>) sedia untuk diperbaharui.</p>
        <p><a href="${d.payment_url}" style="display:inline-block;padding:10px 20px;background:#1e5ab8;color:#fff;border-radius:8px;text-decoration:none;margin:12px 0">Bayar Sekarang</a></p>
        <p>Jika tidak dibayar dalam 14 hari, akaun anda akan bertukar ke pelan Percuma.</p>
        <p>— ReRumah</p>
      `,
    },
  },
  'subscription-dunning': {
    en: {
      subject: 'ReRumah — Payment overdue ({{days_past}} days)',
      body: (d) => `
        <h2>Your payment is ${d.days_past} days overdue</h2>
        <p>Hi ${d.landlord_name},</p>
        <p>We haven't received your subscription payment yet. Please complete payment to keep your account active.</p>
        <p>Log in to ReRumah and visit Plans to pay.</p>
        <p>— ReRumah</p>
      `,
    },
    ms: {
      subject: 'ReRumah — Bayaran tertunggak ({{days_past}} hari)',
      body: (d) => `
        <h2>Bayaran anda tertunggak ${d.days_past} hari</h2>
        <p>Assalamualaikum ${d.landlord_name},</p>
        <p>Kami masih belum menerima bayaran langganan anda. Sila selesaikan bayaran untuk kekalkan akaun anda aktif.</p>
        <p>Log masuk ke ReRumah dan lawati Pelan untuk membayar.</p>
        <p>— ReRumah</p>
      `,
    },
  },
  'subscription-expired': {
    en: {
      subject: 'ReRumah — Switched to Free plan',
      body: (d) => `
        <h2>Account moved to Free plan</h2>
        <p>Hi ${d.landlord_name},</p>
        <p>Your subscription has expired and your account has been moved to the Free plan. You can still use ReRumah and upgrade anytime from the Plans page.</p>
        <p>— ReRumah</p>
      `,
    },
    ms: {
      subject: 'ReRumah — Ditukar ke pelan Percuma',
      body: (d) => `
        <h2>Akaun dipindahkan ke pelan Percuma</h2>
        <p>Assalamualaikum ${d.landlord_name},</p>
        <p>Langganan anda telah tamat dan akaun anda ditukar ke pelan Percuma. Anda masih boleh menggunakan ReRumah dan naik taraf bila-bila masa dari halaman Pelan.</p>
        <p>— ReRumah</p>
      `,
    },
  },
  'subscription-annual-reminder': {
    en: {
      subject: 'ReRumah — Annual renewal in {{days_out}} days',
      body: (d) => `
        <h2>Your annual subscription renews on ${String(d.period_end).slice(0, 10)}</h2>
        <p>Hi ${d.landlord_name},</p>
        <p>Just a heads-up that your annual subscription will renew in ${d.days_out} days. No action needed — we'll send a payment link on renewal day.</p>
        <p>— ReRumah</p>
      `,
    },
    ms: {
      subject: 'ReRumah — Pembaharuan tahunan dalam {{days_out}} hari',
      body: (d) => `
        <h2>Langganan tahunan anda akan diperbaharui pada ${String(d.period_end).slice(0, 10)}</h2>
        <p>Assalamualaikum ${d.landlord_name},</p>
        <p>Sekadar peringatan, langganan tahunan anda akan diperbaharui dalam ${d.days_out} hari. Tiada tindakan diperlukan — kami akan hantar pautan bayaran pada hari pembaharuan.</p>
        <p>— ReRumah</p>
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
        <p style="font-size:12px;color:#999">This email was sent by ReRumah. Do not reply to this email.</p>
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

    // Log notification (skipped for subscription emails — no tenant/property context)
    if (tenant_id && property_id) {
      await supabase.from('notification_log').insert({
        tenant_id,
        property_id,
        channel: 'email',
        type: template,
        status,
        detail: { subject, to, resend_id: result.id || null, error: result.message || null },
      })
    }

    return new Response(JSON.stringify({ success: response.ok, id: result.id }))
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})
