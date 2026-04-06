-- Per-property due day (default day 15, capped at 28 for February safety)
ALTER TABLE payment_settings
  ADD COLUMN due_day INTEGER NOT NULL DEFAULT 15
  CHECK (due_day BETWEEN 1 AND 28);

-- Due date stored on each bill, computed at generation time
ALTER TABLE monthly_bills
  ADD COLUMN due_date DATE;

-- Backfill existing bills with day 15
UPDATE monthly_bills
  SET due_date = (month || '-15')::date
  WHERE due_date IS NULL;
