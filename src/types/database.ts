export type UserRole = 'landlord' | 'tenant'
export type RoomStatus = 'occupied' | 'vacant'
export type TenancyStatus = 'active' | 'ended'
export type BillStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type SplitMethod = 'sub_meter' | 'equal' | 'fixed' | 'absorbed'
export type UtilityType = 'electric' | 'water' | 'internet'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'duitnow' | 'other'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'
export type ActivityType = 'bill_generated' | 'payment_received' | 'tenant_joined' | 'tenant_left' | 'overdue'

export interface Profile {
  id: string
  auth_id: string
  role: UserRole
  name: string
  phone: string
  email: string
  ic_number?: string
  emergency_contact?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  landlord_id: string
  name: string
  address: string
  photo_url?: string
  billing_date: number // day of month (1-28)
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  property_id: string
  label: string
  rent_amount: number
  status: RoomStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Tenancy {
  id: string
  tenant_id: string
  room_id: string
  move_in: string
  move_out?: string
  deposit: number
  agreed_rent: number
  deposit_deductions?: DepositDeduction[]
  status: TenancyStatus
  created_at: string
  updated_at: string
}

export interface DepositDeduction {
  item: string
  amount: number
  photo_url?: string
}

export interface ActivityLog {
  id: string
  landlord_id: string
  type: ActivityType
  title: string
  detail: string | null
  related_id: string | null
  read: boolean
  created_at: string
}

export interface UtilityTemplate {
  id: string
  property_id: string
  type: UtilityType
  split_method: SplitMethod
  default_amount: number | null
  fixed_amount_per_room: number | null
  is_active: boolean
  created_at: string
}

export type UtilityBillSource = 'manual' | 'scanned' | 'template'

export interface UtilityBill {
  id: string
  property_id: string
  month: string // YYYY-MM format
  type: UtilityType
  total_amount: number
  split_method: SplitMethod
  per_room_readings?: SubMeterReading[]
  fixed_amount_per_room?: number
  source: UtilityBillSource
  scan_confidence?: Record<string, number>
  scan_image_url?: string | null
  created_at: string
}

export interface SubMeterReading {
  room_id: string
  reading: number
}

export interface MonthlyBill {
  id: string
  tenant_id: string
  room_id: string
  property_id: string
  month: string // YYYY-MM format
  rent_amount: number
  utility_breakdown: UtilityBreakdownItem[]
  total_due: number
  total_paid: number
  status: BillStatus
  due_date?: string
  created_at: string
  updated_at: string
}

export interface UtilityBreakdownItem {
  type: UtilityType
  amount: number
  split_method: SplitMethod
  detail?: string
}

export interface Payment {
  id: string
  bill_id: string
  amount: number
  date: string
  method: PaymentMethod
  receipt_sent: boolean
  notes?: string
  created_at: string
}

export interface RentAgreement {
  id: string
  property_id: string
  room_id: string
  landlord_id: string
  tenant_id: string | null
  tenancy_id: string | null
  start_date: string
  end_date: string | null
  rent_amount: number
  deposit_amount: number
  payment_due_day: number
  notice_period_days: number
  utilities_included: UtilityIncluded[]
  rules: AgreementRule[]
  additional_terms: string | null
  landlord_name: string
  landlord_ic: string | null
  landlord_phone: string
  landlord_address: string | null
  tenant_name: string | null
  tenant_ic: string | null
  tenant_phone: string | null
  landlord_signed_at: string | null
  tenant_signed_at: string | null
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'terminated'
  created_at: string
  updated_at: string
}

export interface UtilityIncluded {
  type: UtilityType
  included: boolean
  note?: string
}

export interface AgreementRule {
  rule: string
}

export interface Invite {
  id: string
  property_id: string
  room_id: string
  landlord_id: string
  token: string
  email: string | null
  agreed_rent: number
  deposit: number
  move_in: string
  status: InviteStatus
  expires_at: string
  created_at: string
}

// Supabase Database type for client generation
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Property, 'id' | 'created_at'>>
      }
      rooms: {
        Row: Room
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Room, 'id' | 'created_at'>>
      }
      tenancies: {
        Row: Tenancy
        Insert: Omit<Tenancy, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tenancy, 'id' | 'created_at'>>
      }
      utility_bills: {
        Row: UtilityBill
        Insert: Omit<UtilityBill, 'id' | 'created_at'>
        Update: Partial<Omit<UtilityBill, 'id' | 'created_at'>>
      }
      monthly_bills: {
        Row: MonthlyBill
        Insert: Omit<MonthlyBill, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MonthlyBill, 'id' | 'created_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      invites: {
        Row: Invite
        Insert: Omit<Invite, 'id' | 'token' | 'expires_at' | 'created_at'>
        Update: Partial<Omit<Invite, 'id' | 'created_at'>>
      }
    }
  }
}
