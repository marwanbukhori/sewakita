-- Fix infinite recursion in RLS policies
-- The issue: nested policies (rooms -> properties -> profiles) cause recursion
-- when Supabase joins tables with select('*, rooms(*)')
--
-- Solution: use a SECURITY DEFINER function to get the current user's profile ID
-- without triggering RLS on the profiles table.

-- Helper function: get current user's profile ID (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Helper function: get current user's property IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_property_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM properties WHERE landlord_id = (
    SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1
  );
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Landlord can manage properties" ON properties;
DROP POLICY IF EXISTS "Landlord can manage rooms" ON rooms;
DROP POLICY IF EXISTS "Tenant can view own room" ON rooms;
DROP POLICY IF EXISTS "Landlord can manage tenancies" ON tenancies;
DROP POLICY IF EXISTS "Tenant can view own tenancy" ON tenancies;
DROP POLICY IF EXISTS "Landlord can manage utility bills" ON utility_bills;
DROP POLICY IF EXISTS "Landlord can manage monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Tenant can view own bills" ON monthly_bills;
DROP POLICY IF EXISTS "Landlord can manage payments" ON payments;
DROP POLICY IF EXISTS "Tenant can view own payments" ON payments;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true); -- landlords create tenant profiles

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = auth_id);

-- Landlords need to read tenant profiles for display
CREATE POLICY "profiles_select_tenants" ON profiles
  FOR SELECT USING (
    role = 'tenant' AND id IN (
      SELECT t.tenant_id FROM tenancies t
      WHERE t.room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT get_my_property_ids()))
    )
  );

-- ============================================
-- PROPERTIES (simple: just check landlord_id)
-- ============================================
CREATE POLICY "properties_all" ON properties
  FOR ALL USING (landlord_id = get_my_profile_id());

-- ============================================
-- ROOMS (use helper function, no nested policy)
-- ============================================
CREATE POLICY "rooms_landlord" ON rooms
  FOR ALL USING (property_id IN (SELECT get_my_property_ids()));

CREATE POLICY "rooms_tenant" ON rooms
  FOR SELECT USING (
    id IN (
      SELECT room_id FROM tenancies WHERE tenant_id = get_my_profile_id()
    )
  );

-- ============================================
-- TENANCIES
-- ============================================
CREATE POLICY "tenancies_landlord" ON tenancies
  FOR ALL USING (room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT get_my_property_ids())));

CREATE POLICY "tenancies_tenant" ON tenancies
  FOR SELECT USING (tenant_id = get_my_profile_id());

-- ============================================
-- UTILITY BILLS
-- ============================================
CREATE POLICY "utility_bills_landlord" ON utility_bills
  FOR ALL USING (property_id IN (SELECT get_my_property_ids()));

-- ============================================
-- MONTHLY BILLS
-- ============================================
CREATE POLICY "monthly_bills_landlord" ON monthly_bills
  FOR ALL USING (property_id IN (SELECT get_my_property_ids()));

CREATE POLICY "monthly_bills_tenant" ON monthly_bills
  FOR SELECT USING (tenant_id = get_my_profile_id());

-- ============================================
-- PAYMENTS
-- ============================================
CREATE POLICY "payments_landlord" ON payments
  FOR ALL USING (
    bill_id IN (SELECT id FROM monthly_bills WHERE property_id IN (SELECT get_my_property_ids()))
  );

CREATE POLICY "payments_tenant" ON payments
  FOR SELECT USING (
    bill_id IN (SELECT id FROM monthly_bills WHERE tenant_id = get_my_profile_id())
  );
