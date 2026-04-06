import { supabase } from '@/lib/supabase'
import type { UtilityBill, UtilityType } from '@/types/database'

export async function getLastNMonthsUtilities(
  propertyId: string,
  utilityType: UtilityType,
  n: number,
  currentMonth: string
): Promise<UtilityBill[]> {
  const months: string[] = []
  for (let i = 1; i <= n; i++) {
    const d = new Date(currentMonth + '-01')
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0, 7))
  }

  const { data } = await supabase
    .from('utility_bills')
    .select('*')
    .eq('property_id', propertyId)
    .eq('type', utilityType)
    .in('month', months)
    .order('month', { ascending: false })

  return data || []
}

export function calculateUtilityAverage(utilities: UtilityBill[]): number {
  if (utilities.length === 0) return 0
  return Math.round(utilities.reduce((sum, u) => sum + u.total_amount, 0) / utilities.length)
}

export function getSuggestedAmount(utilities: UtilityBill[]): number | null {
  if (utilities.length === 0) return null
  return utilities[0].total_amount // most recent
}
