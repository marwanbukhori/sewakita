-- Delete a user and ALL their data completely.
-- Usage: Change 'user@example.com' to the target email, then run via CLI:
--   sed 's/user@example.com/actual@email.com/g' scripts/delete-test-user.sql | supabase db query --linked
-- Or paste into Supabase SQL Editor after find-replacing the email.
-- WARNING: This permanently deletes everything for this user.

-- Delete invites (must be first — referenced by rooms and agreements)
DELETE FROM invites WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');
DELETE FROM invites WHERE room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com')));
DELETE FROM invites WHERE email = 'user@example.com';

-- Delete payment-related data
DELETE FROM payment_claims WHERE bill_id IN (SELECT id FROM monthly_bills WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com')));
DELETE FROM payment_claims WHERE bill_id IN (SELECT id FROM monthly_bills WHERE tenant_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));
DELETE FROM payments WHERE bill_id IN (SELECT id FROM monthly_bills WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com')));
DELETE FROM payments WHERE bill_id IN (SELECT id FROM monthly_bills WHERE tenant_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));

-- Delete notification logs
DELETE FROM notification_log WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));
DELETE FROM notification_log WHERE tenant_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');

-- Delete bills and billing data
DELETE FROM monthly_bills WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));
DELETE FROM monthly_bills WHERE tenant_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');
DELETE FROM utility_bills WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));
DELETE FROM utility_templates WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));
DELETE FROM bill_generation_log WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));

-- Delete property settings
DELETE FROM notification_settings WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));
DELETE FROM payment_settings WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));

-- Delete agreements
DELETE FROM rent_agreements WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));
DELETE FROM rent_agreements WHERE tenant_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');

-- Delete tenancies and rooms
DELETE FROM tenancies WHERE room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com')));
DELETE FROM tenancies WHERE tenant_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');
DELETE FROM rooms WHERE property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));

-- Delete properties
DELETE FROM properties WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');

-- Delete user-level data
DELETE FROM activity_log WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');
DELETE FROM subscriptions WHERE landlord_id IN (SELECT id FROM profiles WHERE email = 'user@example.com');

-- Reset invites that targeted this email
UPDATE invites SET status = 'pending' WHERE email = 'user@example.com' AND status = 'accepted';
UPDATE rooms SET status = 'vacant' WHERE id IN (SELECT room_id FROM tenancies WHERE tenant_id IN (SELECT id FROM profiles WHERE email = 'user@example.com'));

-- Delete profile and auth user
DELETE FROM profiles WHERE email = 'user@example.com';
DELETE FROM auth.users WHERE email = 'user@example.com';
