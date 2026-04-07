-- ============================================================
-- SewaKita: Reset Billing Data for Testing
-- ============================================================
-- WARNING: This script DELETES billing data permanently.
-- Use ONLY in development/staging. NEVER run in production.
--
-- Usage:
--   Option A: Paste into Supabase Dashboard > SQL Editor
--   Option B: supabase db query --linked < scripts/reset-billing-data.sql
--
-- What it does:
--   Deletes all billing data (bills, payments, utilities, logs)
--
-- What it does NOT touch:
--   Properties, rooms, tenancies, profiles, subscriptions,
--   plans, promo codes, rent agreements, payment settings
-- ============================================================

BEGIN;

DELETE FROM payments;
DELETE FROM payment_claims;
DELETE FROM monthly_bills;
DELETE FROM utility_bills;
DELETE FROM utility_templates;
DELETE FROM bill_generation_log;
DELETE FROM notification_log;
DELETE FROM activity_log
  WHERE type IN ('bill_generated', 'payment_received', 'overdue', 'utility_scanned', 'promo_redeemed');

COMMIT;

SELECT 'Billing data reset complete. Properties, rooms, tenancies, and accounts are untouched.' AS result;
