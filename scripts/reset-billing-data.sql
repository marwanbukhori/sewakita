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
--   1. Deletes all payments (clears payment history)
--   2. Deletes all monthly bills (clears generated bills)
--   3. Deletes all utility bills (clears entered utilities)
--   4. Deletes all utility templates (clears saved templates)
--   5. Clears bill generation logs
--   6. Clears activity logs related to billing
--   7. Clears notification logs
--   8. Clears scanned utility images from storage references
--
-- What it does NOT touch:
--   - Properties, rooms, tenancies (your setup stays intact)
--   - Profiles, auth accounts
--   - Subscriptions, plans, promo codes
--   - Rent agreements
--   - Payment settings (ToyyibPay config)
--   - Invites
-- ============================================================

BEGIN;

-- 1. Delete payments (depends on monthly_bills)
DELETE FROM payments;
RAISE NOTICE 'Deleted all payments';

-- 2. Delete monthly bills
DELETE FROM monthly_bills;
RAISE NOTICE 'Deleted all monthly bills';

-- 3. Delete utility bills
DELETE FROM utility_bills;
RAISE NOTICE 'Deleted all utility bills';

-- 4. Delete utility templates
DELETE FROM utility_templates;
RAISE NOTICE 'Deleted all utility templates';

-- 5. Clear bill generation logs
DELETE FROM bill_generation_log;
RAISE NOTICE 'Cleared bill generation logs';

-- 6. Clear billing-related activity logs
DELETE FROM activity_log
WHERE type IN ('bill_generated', 'payment_received', 'overdue', 'utility_scanned', 'promo_redeemed');
RAISE NOTICE 'Cleared billing activity logs';

-- 7. Clear notification logs
DELETE FROM notification_log;
RAISE NOTICE 'Cleared notification logs';

-- 8. Clear payment claims
DELETE FROM payment_claims;
RAISE NOTICE 'Cleared payment claims';

COMMIT;

-- Summary
SELECT 'Billing data reset complete. Properties, rooms, tenancies, and accounts are untouched.' AS result;
