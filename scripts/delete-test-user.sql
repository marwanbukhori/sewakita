-- Delete a test user completely
-- Usage: Replace the email below, then run in Supabase SQL Editor
-- WARNING: This permanently deletes all data for this user

DO $$
DECLARE
  target_email TEXT := 'emanbukhori@gmail.com';  -- CHANGE THIS
  profile_id UUID;
  auth_id UUID;
BEGIN
  -- Find profile
  SELECT id INTO profile_id FROM profiles WHERE email = target_email;
  SELECT id INTO auth_id FROM auth.users WHERE email = target_email;

  IF profile_id IS NULL AND auth_id IS NULL THEN
    RAISE NOTICE 'User % not found', target_email;
    RETURN;
  END IF;

  -- Delete in order (respecting foreign keys)
  IF profile_id IS NOT NULL THEN
    DELETE FROM notification_log WHERE tenant_id = profile_id;
    DELETE FROM payments WHERE bill_id IN (SELECT id FROM monthly_bills WHERE tenant_id = profile_id);
    DELETE FROM monthly_bills WHERE tenant_id = profile_id;
    DELETE FROM tenancies WHERE tenant_id = profile_id;
    DELETE FROM rent_agreements WHERE tenant_id = profile_id;
    DELETE FROM activity_log WHERE landlord_id = profile_id;
    DELETE FROM subscriptions WHERE landlord_id = profile_id;
    DELETE FROM invites WHERE landlord_id = profile_id;
    -- Reset invites that were for this tenant (back to pending)
    UPDATE invites SET status = 'pending' WHERE email = target_email AND status = 'accepted';
    -- Reset rooms that this tenant occupied
    UPDATE rooms SET status = 'vacant' WHERE id IN (
      SELECT room_id FROM tenancies WHERE tenant_id = profile_id
    );
    DELETE FROM profiles WHERE id = profile_id;
    RAISE NOTICE 'Deleted profile: %', profile_id;
  END IF;

  IF auth_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = auth_id;
    RAISE NOTICE 'Deleted auth user: %', auth_id;
  END IF;

  RAISE NOTICE 'User % fully deleted', target_email;
END $$;
