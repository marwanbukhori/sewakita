-- Rent agreement table
CREATE TABLE rent_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  tenant_id UUID REFERENCES profiles(id),
  tenancy_id UUID REFERENCES tenancies(id),

  -- Agreement details
  start_date DATE NOT NULL,
  end_date DATE,
  rent_amount NUMERIC NOT NULL,
  deposit_amount NUMERIC NOT NULL DEFAULT 0,
  payment_due_day INTEGER NOT NULL DEFAULT 1 CHECK (payment_due_day BETWEEN 1 AND 28),
  notice_period_days INTEGER NOT NULL DEFAULT 30,

  -- Utilities included
  utilities_included JSONB DEFAULT '[]',

  -- Rules & terms
  rules JSONB DEFAULT '[]',
  additional_terms TEXT,

  -- Landlord info (snapshot)
  landlord_name TEXT NOT NULL,
  landlord_ic TEXT,
  landlord_phone TEXT NOT NULL,
  landlord_address TEXT,

  -- Tenant info (filled on acceptance)
  tenant_name TEXT,
  tenant_ic TEXT,
  tenant_phone TEXT,

  -- Signatures
  landlord_signed_at TIMESTAMPTZ,
  tenant_signed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired', 'terminated')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agreements_property ON rent_agreements(property_id);
CREATE INDEX idx_agreements_tenant ON rent_agreements(tenant_id);
ALTER TABLE rent_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY agreements_landlord ON rent_agreements
  FOR ALL USING (landlord_id = get_my_profile_id());
CREATE POLICY agreements_tenant_view ON rent_agreements
  FOR SELECT USING (tenant_id = get_my_profile_id());
CREATE POLICY agreements_tenant_sign ON rent_agreements
  FOR UPDATE USING (tenant_id = get_my_profile_id())
  WITH CHECK (tenant_id = get_my_profile_id());

-- Link invite to agreement
ALTER TABLE invites ADD COLUMN agreement_id UUID REFERENCES rent_agreements(id);
