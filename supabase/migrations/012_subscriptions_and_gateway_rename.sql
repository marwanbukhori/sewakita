-- ============================================
-- PLANS — subscription tier definitions
-- ============================================
CREATE TABLE plans (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  price_myr NUMERIC(10,2) NOT NULL,
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('none', 'monthly', 'annual')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_read ON plans FOR SELECT TO authenticated USING (true);

-- Seed plans (prices per PRD §8; annual = monthly × 10 = "2 months free")
INSERT INTO plans (code, display_name, price_myr, billing_interval, sort_order) VALUES
  ('free',             'Free',              0,    'none',    0),
  ('trial_pro',        'Pro Trial',         0,    'none',    1),
  ('starter_monthly',  'Starter (Monthly)', 19,   'monthly', 10),
  ('starter_annual',   'Starter (Annual)',  190,  'annual',  11),
  ('pro_monthly',      'Pro (Monthly)',     39,   'monthly', 20),
  ('pro_annual',       'Pro (Annual)',      390,  'annual',  21),
  ('business_monthly', 'Business (Monthly)',79,   'monthly', 30),
  ('business_annual',  'Business (Annual)', 790,  'annual',  31);

-- ============================================
-- SUBSCRIPTIONS — one row per landlord's current plan
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES plans(code),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'expired', 'cancelled')),
  period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end TIMESTAMPTZ NOT NULL,
  gateway TEXT,
  gateway_bill_ref TEXT,
  gateway_category_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_landlord ON subscriptions(landlord_id);
CREATE INDEX idx_subscriptions_status_period ON subscriptions(status, period_end);

-- At most one active-or-past-due subscription per landlord
CREATE UNIQUE INDEX idx_subscriptions_one_live_per_landlord
  ON subscriptions(landlord_id)
  WHERE status IN ('active', 'past_due');

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_owner ON subscriptions
  FOR ALL USING (landlord_id = get_my_profile_id());
