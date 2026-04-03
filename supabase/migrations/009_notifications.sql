-- Notification preferences per property
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  on_bill_generated BOOLEAN NOT NULL DEFAULT true,
  on_payment_received BOOLEAN NOT NULL DEFAULT true,
  on_overdue INTEGER DEFAULT 3,
  on_agreement_ready BOOLEAN NOT NULL DEFAULT true,
  reply_to_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_settings_landlord ON notification_settings
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE landlord_id = get_my_profile_id()));

-- Notification log
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_log_tenant ON notification_log(tenant_id, created_at DESC);
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_log_landlord ON notification_log
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE landlord_id = get_my_profile_id()));
