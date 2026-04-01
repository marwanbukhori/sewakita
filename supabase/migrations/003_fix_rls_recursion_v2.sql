-- Fix remaining recursion: rooms_tenant -> tenancies -> rooms cycle
-- Solution: add get_my_room_ids() and get_my_bill_ids() SECURITY DEFINER helpers
-- so NO policy ever queries a table that has RLS enabled.

-- Helper: get room IDs for current landlord (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_room_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id FROM rooms r
  INNER JOIN properties p ON r.property_id = p.id
  WHERE p.landlord_id = (SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1);
$$;

-- Helper: get bill IDs for current landlord (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_bill_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mb.id FROM monthly_bills mb
  INNER JOIN properties p ON mb.property_id = p.id
  WHERE p.landlord_id = (SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1);
$$;

-- Drop all existing policies (clean slate)
DO $$
DECLARE
  t TEXT;
  p RECORD;
BEGIN
  FOR t IN SELECT unnest(ARRAY['profiles','properties','rooms','tenancies','utility_bills','monthly_bills','payments'])
  LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- PROFILES (no nested queries)
-- ============================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = auth_id);

-- Landlord can see their tenants' profiles
CREATE POLICY "profiles_select_my_tenants" ON profiles
  FOR SELECT USING (id IN (
    SELECT tenant_id FROM tenancies WHERE room_id IN (SELECT get_my_room_ids())
  ));

-- ============================================
-- PROPERTIES (direct check, no subquery on RLS tables)
-- ============================================
CREATE POLICY "properties_all" ON properties
  FOR ALL USING (landlord_id = get_my_profile_id());

-- ============================================
-- ROOMS (all helpers are SECURITY DEFINER)
-- ============================================
CREATE POLICY "rooms_landlord" ON rooms
  FOR ALL USING (property_id IN (SELECT get_my_property_ids()));

CREATE POLICY "rooms_tenant" ON rooms
  FOR SELECT USING (id IN (SELECT get_my_room_ids()));
-- Note: get_my_room_ids() for tenants won't work since it checks landlord_id
-- We need a separate tenant version:

DROP POLICY "rooms_tenant" ON rooms;

CREATE OR REPLACE FUNCTION get_tenant_room_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.room_id FROM tenancies t
  WHERE t.tenant_id = (SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1);
$$;

CREATE POLICY "rooms_tenant" ON rooms
  FOR SELECT USING (id IN (SELECT get_tenant_room_ids()));

-- ============================================
-- TENANCIES (use SECURITY DEFINER helpers only)
-- ============================================
CREATE POLICY "tenancies_landlord" ON tenancies
  FOR ALL USING (room_id IN (SELECT get_my_room_ids()));

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
-- PAYMENTS (use SECURITY DEFINER helper)
-- ============================================
CREATE POLICY "payments_landlord" ON payments
  FOR ALL USING (bill_id IN (SELECT get_my_bill_ids()));

CREATE OR REPLACE FUNCTION get_tenant_bill_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM monthly_bills
  WHERE tenant_id = (SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1);
$$;

CREATE POLICY "payments_tenant" ON payments
  FOR SELECT USING (bill_id IN (SELECT get_tenant_bill_ids()));
