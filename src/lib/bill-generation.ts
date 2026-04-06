import type { UtilityBill, Room, Tenancy, Profile } from '@/types/database'

type RoomWithTenancies = Room & { tenancies: (Tenancy & { tenant: Profile })[] }

export interface DraftBill {
  tenant_id: string
  tenant_name: string
  room_id: string
  room_label: string
  rent_amount: number
  utility_breakdown: { type: string; amount: number; split_method: string }[]
  total_due: number
}

export function computeDraftBills(
  rooms: RoomWithTenancies[],
  utilities: UtilityBill[],
  month: string,
  propertyId: string,
  existingBillKeys: Set<string>
): DraftBill[] {
  const occupiedRooms = rooms.filter(r => r.status === 'occupied')
  const drafts: DraftBill[] = []

  for (const room of occupiedRooms) {
    const activeTenancy = room.tenancies?.find(t => t.status === 'active')
    if (!activeTenancy) continue

    const billKey = `${room.id}_${activeTenancy.tenant_id}`
    if (existingBillKeys.has(billKey)) continue

    const moveInDate = new Date(activeTenancy.move_in)
    const billMonth = new Date(month + '-01')
    let rentAmount = activeTenancy.agreed_rent

    if (moveInDate.getFullYear() === billMonth.getFullYear() && moveInDate.getMonth() === billMonth.getMonth()) {
      const daysInMonth = new Date(billMonth.getFullYear(), billMonth.getMonth() + 1, 0).getDate()
      const remainingDays = daysInMonth - moveInDate.getDate() + 1
      rentAmount = Math.round((activeTenancy.agreed_rent * remainingDays) / daysInMonth)
    }

    const utilityBreakdown = utilities.map(ub => {
      let amount = 0
      if (ub.split_method === 'absorbed') amount = 0
      else if (ub.split_method === 'equal') amount = Math.round(ub.total_amount / occupiedRooms.length)
      else if (ub.split_method === 'fixed') amount = ub.fixed_amount_per_room || 0
      else if (ub.split_method === 'sub_meter' && ub.per_room_readings) {
        const totalReadings = ub.per_room_readings.reduce((s, r) => s + r.reading, 0)
        const roomReading = ub.per_room_readings.find(r => r.room_id === room.id)
        if (roomReading && totalReadings > 0) amount = Math.round((roomReading.reading / totalReadings) * ub.total_amount)
      }
      return { type: ub.type, amount, split_method: ub.split_method }
    })

    const totalDue = rentAmount + utilityBreakdown.reduce((s, u) => s + u.amount, 0)

    drafts.push({
      tenant_id: activeTenancy.tenant_id,
      tenant_name: activeTenancy.tenant?.name || 'Penyewa',
      room_id: room.id,
      room_label: room.label,
      rent_amount: rentAmount,
      utility_breakdown: utilityBreakdown,
      total_due: totalDue,
    })
  }

  return drafts
}
