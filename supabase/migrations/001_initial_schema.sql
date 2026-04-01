-- SewaKita Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- ============================================
-- PROFILES (shared auth for landlords + tenants)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('landlord', 'tenant')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  ic_number TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- PROPERTIES
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  photo_url TEXT,
  billing_date INTEGER NOT NULL DEFAULT 1 CHECK (billing_date BETWEEN 1 AND 28),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_properties_landlord ON properties(landlord_id);

-- ============================================
-- ROOMS
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  rent_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rooms_property ON rooms(property_id);

-- ============================================
-- TENANCIES
-- ============================================
CREATE TABLE tenancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  move_in DATE NOT NULL,
  move_out DATE,
  deposit NUMERIC(10,2) NOT NULL DEFAULT 0,
  agreed_rent NUMERIC(10,2) NOT NULL,
  deposit_deductions JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tenancies_tenant ON tenancies(tenant_id);
CREATE INDEX idx_tenancies_room ON tenancies(room_id);

-- ============================================
-- UTILITY BILLS
-- ============================================
CREATE TABLE utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  type TEXT NOT NULL CHECK (type IN ('electric', 'water', 'internet')),
  total_amount NUMERIC(10,2) NOT NULL,
  split_method TEXT NOT NULL CHECK (split_method IN ('sub_meter', 'equal', 'fixed', 'absorbed')),
  per_room_readings JSONB, -- [{room_id, reading}]
  fixed_amount_per_room NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_utility_bills_property_month ON utility_bills(property_id, month);

-- ============================================
-- MONTHLY BILLS
-- ============================================
CREATE TABLE monthly_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  rent_amount NUMERIC(10,2) NOT NULL,
  utility_breakdown JSONB DEFAULT '[]',
  total_due NUMERIC(10,2) NOT NULL,
  total_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_monthly_bills_tenant ON monthly_bills(tenant_id);
CREATE INDEX idx_monthly_bills_property_month ON monthly_bills(property_id, month);
CREATE INDEX idx_monthly_bills_room_month ON monthly_bills(room_id, month);
CREATE UNIQUE INDEX idx_monthly_bills_unique ON monthly_bills(tenant_id, room_id, month);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES monthly_bills(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'duitnow', 'other')),
  receipt_sent BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_bill ON payments(bill_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_id OR true); -- landlord can create tenant profiles

-- Properties: landlord can CRUD their own properties
CREATE POLICY "Landlord can manage properties" ON properties
  FOR ALL USING (
    landlord_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );

-- Rooms: landlord can manage rooms in their properties
CREATE POLICY "Landlord can manage rooms" ON rooms
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  );

-- Tenants can view rooms they're assigned to
CREATE POLICY "Tenant can view own room" ON rooms
  FOR SELECT USING (
    id IN (SELECT room_id FROM tenancies WHERE tenant_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  );

-- Tenancies: landlord can manage, tenant can view their own
CREATE POLICY "Landlord can manage tenancies" ON tenancies
  FOR ALL USING (
    room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())))
  );

CREATE POLICY "Tenant can view own tenancy" ON tenancies
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );

-- Utility bills: landlord can manage
CREATE POLICY "Landlord can manage utility bills" ON utility_bills
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  );

-- Monthly bills: landlord can manage, tenant can view their own
CREATE POLICY "Landlord can manage monthly bills" ON monthly_bills
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  );

CREATE POLICY "Tenant can view own bills" ON monthly_bills
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );

-- Payments: landlord can manage, tenant can view their own
CREATE POLICY "Landlord can manage payments" ON payments
  FOR ALL USING (
    bill_id IN (SELECT id FROM monthly_bills WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())))
  );

CREATE POLICY "Tenant can view own payments" ON payments
  FOR SELECT USING (
    bill_id IN (SELECT id FROM monthly_bills WHERE tenant_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  );

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tenancies_updated_at BEFORE UPDATE ON tenancies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER monthly_bills_updated_at BEFORE UPDATE ON monthly_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
