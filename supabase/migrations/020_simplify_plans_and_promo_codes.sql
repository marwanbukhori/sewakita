-- Simplify from 5 tiers to 2 (Free + Pro)
DELETE FROM plans WHERE code IN ('trial_pro', 'starter_monthly', 'starter_annual', 'business_monthly', 'business_annual');

-- Update Pro pricing: RM 29/month, RM 290/year
UPDATE plans SET price_myr = 29, display_name = 'Pro' WHERE code = 'pro_monthly';
UPDATE plans SET price_myr = 290, display_name = 'Pro (Annual)' WHERE code = 'pro_annual';

-- Remove trial trigger — new landlords start on Free (no subscription row)
DROP TRIGGER IF EXISTS trg_create_trial_on_landlord_signup ON profiles;
DROP FUNCTION IF EXISTS create_trial_subscription();

-- Expire any existing trial subscriptions
UPDATE subscriptions SET status = 'expired' WHERE plan_code = 'trial_pro';

-- Promo codes table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan_code TEXT NOT NULL,
  max_uses INTEGER NOT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  permanent BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Seed the first-30-users promo code
INSERT INTO promo_codes (code, plan_code, max_uses, permanent)
VALUES ('SEWAKITA30', 'pro_monthly', 30, true);
