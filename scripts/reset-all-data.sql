-- ============================================================
-- SewaKita: Full Data Reset for Testing
-- ============================================================
-- WARNING: This script DELETES ALL user data permanently.
-- Use ONLY in development/staging. NEVER run in production.
--
-- Usage:
--   Option A: Paste into Supabase Dashboard > SQL Editor
--   Option B: supabase db query --linked < scripts/reset-all-data.sql
--
-- What it does:
--   Deletes everything except system tables (plans, promo_codes).
--   After running, you'll need to re-register and set up from scratch.
--
-- What it does NOT touch:
--   - plans table (Free, Pro pricing)
--   - promo_codes table (SEWAKITA30)
--   - Database schema, functions, triggers
--   - Storage buckets (but empties utility-scans)
--   - Edge functions
-- ============================================================

BEGIN;

-- Billing data (order matters due to foreign keys)
DELETE FROM payments;
DELETE FROM payment_claims;
DELETE FROM monthly_bills;
DELETE FROM utility_bills;
DELETE FROM utility_templates;
DELETE FROM bill_generation_log;
DELETE FROM notification_log;
DELETE FROM activity_log;

-- Agreements
DELETE FROM rent_agreements;

-- Subscriptions (keeps plans and promo_codes)
DELETE FROM subscriptions;

-- Tenancy data
DELETE FROM invites;
DELETE FROM tenancies;

-- Property data
DELETE FROM payment_settings;
DELETE FROM notification_settings;
DELETE FROM rooms;
DELETE FROM properties;

-- User data (this will cascade auth cleanup on next login)
DELETE FROM profiles;

-- Reset promo code usage counter
UPDATE promo_codes SET current_uses = 0;

-- Clean up storage
DELETE FROM storage.objects WHERE bucket_id = 'utility-scans';

COMMIT;

SELECT 'Full data reset complete. Re-register to start fresh. Plans and promo codes preserved.' AS result;
