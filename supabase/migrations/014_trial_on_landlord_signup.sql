-- Auto-create a 60-day Pro trial subscription when a landlord profile is inserted.
-- Trial is stored as a subscription row (plan_code='trial_pro') so access checks
-- have a single code path for trial/free/paid.

CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'landlord' THEN
    -- Idempotent: only create if no live subscription exists yet
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE landlord_id = NEW.id
        AND status IN ('active', 'past_due')
    ) THEN
      INSERT INTO subscriptions (
        landlord_id, plan_code, status, period_start, period_end
      ) VALUES (
        NEW.id, 'trial_pro', 'active', now(), now() + interval '60 days'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_trial_on_landlord_signup
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_trial_subscription();

-- Optional one-time backfill for existing landlords (uncomment to run manually):
-- INSERT INTO subscriptions (landlord_id, plan_code, status, period_start, period_end)
-- SELECT id, 'trial_pro', 'active', now(), now() + interval '60 days'
-- FROM profiles p
-- WHERE role = 'landlord'
--   AND NOT EXISTS (
--     SELECT 1 FROM subscriptions s
--     WHERE s.landlord_id = p.id AND s.status IN ('active', 'past_due')
--   );
