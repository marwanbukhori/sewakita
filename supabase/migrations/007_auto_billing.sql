-- Bill generation log
CREATE TABLE bill_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  month TEXT NOT NULL,
  bills_created INTEGER NOT NULL DEFAULT 0,
  triggered_by TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bill_generation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY bill_gen_log_landlord ON bill_generation_log
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE landlord_id = get_my_profile_id()));

-- Activity feed for dashboard
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  related_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_landlord ON activity_log(landlord_id, created_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_owner ON activity_log
  FOR ALL USING (landlord_id = get_my_profile_id());

-- Utility templates for recurring bills
CREATE TABLE utility_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  type TEXT NOT NULL,
  split_method TEXT NOT NULL,
  default_amount NUMERIC,
  fixed_amount_per_room NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_utility_templates_property ON utility_templates(property_id);
ALTER TABLE utility_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY utility_templates_landlord ON utility_templates
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE landlord_id = get_my_profile_id()));

-- Function to auto-mark overdue bills
CREATE OR REPLACE FUNCTION mark_overdue_bills()
RETURNS void AS $$
BEGIN
  UPDATE monthly_bills
  SET status = 'overdue', updated_at = now()
  WHERE status IN ('pending', 'partial')
  AND month < to_char(now(), 'YYYY-MM');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
