import type { MonthlyBill } from '@/types/database'

const UTILITY_LABELS = {
  electric: 'Elektrik',
  water: 'Air',
  internet: 'Internet',
}

export function generateBillMessage(bill: MonthlyBill, tenantName: string): string {
  const lines = [
    `Assalamualaikum ${tenantName},`,
    '',
    `Bil sewa bulan *${formatMonth(bill.month)}*:`,
    '',
    `Sewa bilik: RM${bill.rent_amount}`,
  ]

  if (bill.utility_breakdown?.length) {
    for (const u of bill.utility_breakdown) {
      if (u.amount > 0) {
        lines.push(`${UTILITY_LABELS[u.type] || u.type}: RM${u.amount}`)
      }
    }
  }

  lines.push('')
  lines.push(`*Jumlah: RM${bill.total_due}*`)

  if (bill.total_paid > 0) {
    lines.push(`Telah dibayar: RM${bill.total_paid}`)
    lines.push(`*Baki: RM${bill.total_due - bill.total_paid}*`)
  }

  lines.push('')
  lines.push('Sila jelaskan bayaran sebelum hujung bulan. Terima kasih!')
  lines.push('')
  lines.push('— SewaKita')

  return lines.join('\n')
}

export function generateReminderMessage(bill: MonthlyBill, tenantName: string): string {
  const outstanding = bill.total_due - bill.total_paid
  return [
    `Assalamualaikum ${tenantName},`,
    '',
    `Ini adalah peringatan mesra bahawa bayaran sewa bulan *${formatMonth(bill.month)}* masih tertunggak.`,
    '',
    `Jumlah tertunggak: *RM${outstanding}*`,
    '',
    'Mohon jelaskan bayaran secepat mungkin. Jika sudah membayar, sila maklumkan. Terima kasih!',
    '',
    '— SewaKita',
  ].join('\n')
}

export function generateReceiptMessage(bill: MonthlyBill, tenantName: string): string {
  return [
    `Assalamualaikum ${tenantName},`,
    '',
    `Terima kasih atas bayaran sewa bulan *${formatMonth(bill.month)}*.`,
    '',
    `Jumlah dibayar: *RM${bill.total_paid}*`,
    `Status: *Selesai*`,
    '',
    'Resit ini adalah untuk rekod anda. Terima kasih!',
    '',
    '— SewaKita',
  ].join('\n')
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  return `${months[parseInt(m) - 1]} ${year}`
}
