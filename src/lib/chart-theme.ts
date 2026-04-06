export const CHART_COLORS = {
  primary: '#0090D1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#94a3b8',
  accent: '#8b5cf6',
} as const

export const CHART_FONT = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
} as const

const MALAY_MONTHS_SHORT = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis']

export function formatRM(amount: number): string {
  return `RM${amount.toLocaleString()}`
}

export function formatMonthShort(month: string): string {
  const m = parseInt(month.split('-')[1])
  return MALAY_MONTHS_SHORT[m - 1] || month
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${MALAY_MONTHS_SHORT[parseInt(m) - 1]} ${year}`
}

export function getLast12Months(fromMonth?: string): string[] {
  const base = fromMonth ? new Date(fromMonth + '-01') : new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(base)
    d.setMonth(d.getMonth() - (11 - i))
    return d.toISOString().slice(0, 7)
  })
}
