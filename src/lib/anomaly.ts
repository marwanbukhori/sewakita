export type AnomalyTier = 'silent' | 'warning' | 'blocker'

export const ANOMALY_THRESHOLDS = {
  WARNING_PCT: 30,
  BLOCKER_PCT: 50,
  MIN_HISTORY_MONTHS: 2,
} as const

export function calculateDeviation(current: number, history: number[]): { delta: number; pct: number } {
  if (history.length === 0) return { delta: 0, pct: 0 }
  const avg = history.reduce((s, v) => s + v, 0) / history.length
  if (avg === 0) return { delta: current, pct: 100 }
  const delta = current - avg
  const pct = Math.round(Math.abs(delta / avg) * 100)
  return { delta, pct }
}

export function getAnomalyTier(pct: number): AnomalyTier {
  if (pct >= ANOMALY_THRESHOLDS.BLOCKER_PCT) return 'blocker'
  if (pct >= ANOMALY_THRESHOLDS.WARNING_PCT) return 'warning'
  return 'silent'
}
