-- Rename Billplz-specific column to generic gateway term
ALTER TABLE payment_settings RENAME COLUMN billplz_collection_id TO gateway_category_code;

-- Add gateway type (default toyyibpay for new rows)
ALTER TABLE payment_settings ADD COLUMN gateway TEXT NOT NULL DEFAULT 'toyyibpay';

-- Store the landlord's own ToyyibPay user secret key (base64-encoded at rest; rotate to pgsodium later)
ALTER TABLE payment_settings ADD COLUMN gateway_secret_key_encrypted TEXT;

-- Update payments.gateway default from 'manual' to 'toyyibpay' for new rows
ALTER TABLE payments ALTER COLUMN gateway SET DEFAULT 'toyyibpay';
