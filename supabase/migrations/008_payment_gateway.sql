-- Payment gateway fields
ALTER TABLE payments ADD COLUMN gateway TEXT DEFAULT 'manual';
ALTER TABLE payments ADD COLUMN gateway_bill_id TEXT;
ALTER TABLE payments ADD COLUMN gateway_url TEXT;
ALTER TABLE payments ADD COLUMN gateway_status TEXT;

-- Payment settings per property
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) UNIQUE,
  billplz_collection_id TEXT,
  payment_methods JSONB DEFAULT '["fpx", "duitnow"]',
  auto_reminder_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_settings_landlord ON payment_settings
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE landlord_id = get_my_profile_id()));
