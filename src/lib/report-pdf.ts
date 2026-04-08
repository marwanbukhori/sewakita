import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export async function captureChart(elementId: string): Promise<string> {
  const el = document.getElementById(elementId)
  if (!el) throw new Error(`Chart element #${elementId} not found`)
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', logging: false })
  return canvas.toDataURL('image/png')
}

export function createReportPDF(title: string, subtitle: string): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Blue header
  doc.setFillColor(0, 144, 209)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ReRumah', margin, 16)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(title, margin, 26)

  doc.setFontSize(9)
  doc.text(subtitle, margin, 33)

  return doc
}

export function addChartToPage(doc: jsPDF, chartDataUrl: string, y: number, height = 80): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const imgWidth = pageWidth - margin * 2
  doc.addImage(chartDataUrl, 'PNG', margin, y, imgWidth, height)
  return y + height + 10
}

export function addTableRows(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number
): number {
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const colWidth = (pageWidth - margin * 2) / headers.length
  let y = startY

  // Header row
  doc.setFillColor(243, 244, 246) // gray-100
  doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128) // gray-500
  headers.forEach((h, i) => {
    doc.text(h, margin + i * colWidth, y)
  })
  y += 8

  // Data rows
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  for (const row of rows) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    // Alternating row shading
    if (rows.indexOf(row) % 2 === 1) {
      doc.setFillColor(249, 250, 251) // gray-50
      doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F')
    }
    row.forEach((cell, i) => {
      const truncated = cell.length > 25 ? cell.slice(0, 22) + '...' : cell
      doc.text(truncated, margin + i * colWidth, y)
    })
    y += 7
  }

  return y + 5
}

export function addStatCard(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFillColor(240, 249, 255) // primary-50
  doc.roundedRect(x, y, 40, 18, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(label, x + 3, y + 6)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 85, 128) // primary-800
  doc.text(value, x + 3, y + 14)
}

export function saveReport(doc: jsPDF, type: string, period: string) {
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175)
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.text(`Dijana oleh ReRumah · ${new Date().toLocaleDateString('ms-MY')}`, 20, pageHeight - 10)
  doc.save(`ReRumah_Laporan_${type}_${period}.pdf`)
}
