import { jsPDF } from 'jspdf'
import type { MonthlyBill, Property, Room, Profile } from '@/types/database'

interface BillWithDetails extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
}

const MALAY_MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${MALAY_MONTHS[parseInt(m) - 1]} ${year}`
}

export function generateBillPDF(bill: BillWithDetails) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  // --- Header ---
  doc.setFillColor(0, 144, 209) // primary-600
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('SewaKita', margin, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Bil Bulanan / Monthly Bill', margin, 26)

  // Month label (right-aligned)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const monthText = formatMonth(bill.month)
  const monthWidth = doc.getStringUnitWidth(monthText) * 14 / doc.internal.scaleFactor
  doc.text(monthText, pageWidth - margin - monthWidth, 18)

  // Status badge
  doc.setFontSize(9)
  const statusLabel = bill.status === 'paid' ? 'SELESAI' : bill.status === 'overdue' ? 'TERTUNGGAK' : bill.status === 'partial' ? 'SEPARA' : 'BELUM BAYAR'
  const statusWidth = doc.getStringUnitWidth(statusLabel) * 9 / doc.internal.scaleFactor
  doc.text(statusLabel, pageWidth - margin - statusWidth, 28)

  y = 55

  // --- Property & Tenant Info ---
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128) // gray-500
  doc.text('HARTANAH / PROPERTY', margin, y)
  y += 6
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(bill.room.property.name, margin, y)
  y += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  if (bill.room.property.address) {
    doc.text(bill.room.property.address, margin, y)
    y += 5
  }

  // Tenant info (right column)
  const rightCol = pageWidth / 2 + 10
  let yRight = 55
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('PENYEWA / TENANT', rightCol, yRight)
  yRight += 6
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(bill.tenant.name, rightCol, yRight)
  yRight += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Bilik: ${bill.room.label}`, rightCol, yRight)
  yRight += 5
  if (bill.due_date) {
    doc.text(`Tarikh akhir: ${new Date(bill.due_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightCol, yRight)
  }

  y = Math.max(y, yRight) + 10

  // --- Divider ---
  doc.setDrawColor(229, 231, 235) // gray-200
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // --- Bill Breakdown Table ---
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('PERKARA / ITEM', margin, y)
  doc.text('JUMLAH (RM)', pageWidth - margin - 30, y)
  y += 3
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Rent row
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sewa bilik / Room rent', margin, y)
  doc.setFont('helvetica', 'bold')
  doc.text(bill.rent_amount.toFixed(2), pageWidth - margin - 30, y)
  y += 8

  // Utility rows
  const utilities = (bill.utility_breakdown || []) as { type: string; amount: number; split_method?: string }[]
  for (const u of utilities) {
    if (u.amount <= 0) continue
    doc.setFont('helvetica', 'normal')
    const label = u.type === 'electric' ? 'Elektrik / Electricity'
      : u.type === 'water' ? 'Air / Water'
      : 'Internet'
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'bold')
    doc.text(u.amount.toFixed(2), pageWidth - margin - 30, y)
    y += 8
  }

  // Divider before total
  y += 2
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.8)
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y)
  y += 8

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('JUMLAH / TOTAL', margin, y)
  doc.text(`RM ${bill.total_due.toFixed(2)}`, pageWidth - margin - 30, y)
  y += 10

  // Payment info
  if (bill.total_paid > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(22, 163, 74) // green-600
    doc.text('Telah dibayar / Paid', margin, y)
    doc.text(`- RM ${bill.total_paid.toFixed(2)}`, pageWidth - margin - 30, y)
    y += 8

    const balance = bill.total_due - bill.total_paid
    if (balance > 0) {
      doc.setTextColor(220, 38, 38) // red-600
      doc.setFont('helvetica', 'bold')
      doc.text('Baki / Balance', margin, y)
      doc.text(`RM ${balance.toFixed(2)}`, pageWidth - margin - 30, y)
    }
    y += 10
  }

  // --- Footer ---
  y += 15
  doc.setTextColor(156, 163, 175) // gray-400
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Bil ini dijana secara automatik oleh SewaKita.', margin, y)
  y += 4
  doc.text('This bill was generated automatically by SewaKita.', margin, y)
  y += 4
  doc.text(`Ref: ${bill.id.slice(0, 8)}`, margin, y)

  return doc
}

export function downloadBillPDF(bill: BillWithDetails) {
  const doc = generateBillPDF(bill)
  const filename = `SewaKita_Bil_${bill.month}_${bill.tenant.name.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
