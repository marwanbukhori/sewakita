-- Allow tenants to create their own profile during invite acceptance
DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Enforce one active tenancy per room
CREATE UNIQUE INDEX idx_one_active_tenant_per_room
  ON tenancies(room_id) WHERE status = 'active';
