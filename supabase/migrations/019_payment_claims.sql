-- ============================================
-- PAYMENT CLAIMS — tenant self-reports "I've paid"
-- Landlord reviews and approves/rejects.
-- Only approved claims create real payment rows.
-- ============================================

CREATE TABLE payment_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES monthly_bills(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'duitnow', 'other')),
  paid_date DATE NOT NULL,
  proof_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payment_claims_bill ON payment_claims(bill_id);
CREATE INDEX idx_payment_claims_tenant ON payment_claims(tenant_id);
CREATE INDEX idx_payment_claims_tenant_status ON payment_claims(tenant_id, status);
CREATE INDEX idx_payment_claims_status ON payment_claims(status);

ALTER TABLE payment_claims ENABLE ROW LEVEL SECURITY;

-- Tenant can insert claims on their own bills
CREATE POLICY claims_tenant_insert ON payment_claims
  FOR INSERT WITH CHECK (tenant_id = get_my_profile_id());

-- Tenant can read their own claims
CREATE POLICY claims_tenant_select ON payment_claims
  FOR SELECT USING (tenant_id = get_my_profile_id());

-- Landlord can read claims on bills they own (via property join)
CREATE POLICY claims_landlord_select ON payment_claims
  FOR SELECT USING (
    bill_id IN (
      SELECT mb.id FROM monthly_bills mb
      JOIN rooms r ON r.id = mb.room_id
      JOIN properties p ON p.id = r.property_id
      WHERE p.landlord_id = get_my_profile_id()
    )
  );

-- Landlord can update claims they can see (approve/reject)
CREATE POLICY claims_landlord_update ON payment_claims
  FOR UPDATE USING (
    bill_id IN (
      SELECT mb.id FROM monthly_bills mb
      JOIN rooms r ON r.id = mb.room_id
      JOIN properties p ON p.id = r.property_id
      WHERE p.landlord_id = get_my_profile_id()
    )
  );

-- Activity log entries for claim lifecycle
CREATE OR REPLACE FUNCTION notify_claim_submitted()
RETURNS TRIGGER AS $$
DECLARE
  v_landlord_id UUID;
  v_tenant_name TEXT;
BEGIN
  SELECT p.landlord_id INTO v_landlord_id
  FROM monthly_bills mb
  JOIN rooms r ON r.id = mb.room_id
  JOIN properties p ON p.id = r.property_id
  WHERE mb.id = NEW.bill_id;

  SELECT name INTO v_tenant_name FROM profiles WHERE id = NEW.tenant_id;

  INSERT INTO activity_log (landlord_id, type, title, detail, related_id)
  VALUES (
    v_landlord_id,
    'payment_received',
    'Payment claim: RM' || NEW.amount,
    v_tenant_name || ' claims to have paid. Review needed.',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_claim_submitted
AFTER INSERT ON payment_claims
FOR EACH ROW
EXECUTE FUNCTION notify_claim_submitted();

-- Note: Supabase Storage bucket 'payment-proofs' must be created via Dashboard:
-- 1. Go to Storage → New Bucket
-- 2. Name: payment-proofs
-- 3. Public: false (RLS-based access)
-- 4. Allowed MIME types: image/jpeg, image/png, image/webp
-- 5. Max file size: 5MB
-- 6. Storage policies:
--    - Authenticated users can upload to their own path: payment-proofs/{user_profile_id}/*
--    - Authenticated users can read all files (landlord needs to view tenant proofs)
