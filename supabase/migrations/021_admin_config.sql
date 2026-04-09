-- =============================================================================
-- Migration 021: Admin Configuration System
--
-- Adds admin panel infrastructure:
-- 1. is_admin flag on profiles (must be landlord)
-- 2. site_config key-value store for app configuration
-- 3. feature_flags for runtime feature toggles
-- 4. config_audit_log for tracking all config changes
-- 5. updated_at on promo_codes (was missing)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Admin flag on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Enforce: only landlords can be admins
ALTER TABLE profiles ADD CONSTRAINT profiles_admin_must_be_landlord
    CHECK (NOT is_admin OR role = 'landlord');

-- Set initial admin
UPDATE profiles SET is_admin = true WHERE email = 'marwanbukhori.dev@gmail.com';

-- ---------------------------------------------------------------------------
-- 2. Promo codes enhancement (missing updated_at)
-- ---------------------------------------------------------------------------
ALTER TABLE promo_codes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- ---------------------------------------------------------------------------
-- 3. Site configuration table
-- ---------------------------------------------------------------------------
CREATE TABLE site_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_site_config_category ON site_config (category);

-- ---------------------------------------------------------------------------
-- 4. Feature flags table
-- ---------------------------------------------------------------------------
CREATE TABLE feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    tier TEXT NOT NULL DEFAULT 'all' CHECK (tier IN ('all', 'free', 'pro')),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. Config audit log
-- ---------------------------------------------------------------------------
CREATE TABLE config_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_key TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_config_audit_log_table ON config_audit_log (table_name, changed_at DESC);

-- ---------------------------------------------------------------------------
-- 6. RLS policies
-- ---------------------------------------------------------------------------

-- site_config: authenticated can read, writes via service_role only
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read config"
    ON site_config FOR SELECT TO authenticated USING (true);

-- feature_flags: authenticated can read, writes via service_role only
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read flags"
    ON feature_flags FOR SELECT TO authenticated USING (true);

-- config_audit_log: no read for authenticated, admin reads via service_role
ALTER TABLE config_audit_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 7. Seed site_config with current hardcoded values
-- ---------------------------------------------------------------------------
INSERT INTO site_config (key, value, description, category) VALUES
    -- Limits
    ('free_property_limit', '1', 'Maximum properties for free tier landlords', 'limits'),

    -- Subscription timelines
    ('dunning_days', '7', 'Days after failed renewal before dunning email', 'subscription'),
    ('expiry_days', '14', 'Days after failed renewal before subscription expires', 'subscription'),
    ('promo_period_days', '30', 'Default subscription period for promo code redemption (days)', 'subscription'),
    ('renewal_period_monthly_days', '30', 'Monthly subscription renewal period (days)', 'subscription'),
    ('renewal_period_annual_days', '365', 'Annual subscription renewal period (days)', 'subscription'),

    -- Notification settings
    ('overdue_reminder_cooldown_days', '7', 'Minimum days between overdue reminders for same bill', 'notification'),
    ('overdue_reminder_intervals', '[1, 3, 5, 7]', 'Available overdue reminder interval options (days)', 'notification'),

    -- Content
    ('free_features', '["1 property", "Bill generation & WhatsApp", "Manual payment recording"]', 'Free tier feature list for plans page', 'content'),
    ('pro_features', '["Unlimited properties", "Online payment (FPX)", "Reports & analytics", "OCR bill scanning", "PDF export", "Priority support"]', 'Pro tier feature list for plans page', 'content'),
    ('announcement_slides', '[]', 'Dashboard announcement carousel slides (JSON array)', 'content');

-- ---------------------------------------------------------------------------
-- 8. Seed feature flags
-- ---------------------------------------------------------------------------
INSERT INTO feature_flags (key, enabled, description, tier) VALUES
    ('online_payments', true, 'Enable ToyyibPay rent collection for tenants', 'pro'),
    ('ocr_bills', true, 'Enable AI utility bill OCR', 'pro'),
    ('reports', true, 'Enable financial reports', 'pro'),
    ('agreements', true, 'Enable rental agreement signing', 'pro'),
    ('auto_bill_generation', true, 'Enable automatic monthly bill generation', 'pro'),
    ('email_notifications', true, 'Enable email notification system', 'pro'),
    ('maintenance_mode', false, 'Show maintenance banner to all users', 'all');
