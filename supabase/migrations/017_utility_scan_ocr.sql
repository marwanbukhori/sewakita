-- OCR audit columns on utility_bills
ALTER TABLE utility_bills
  ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'scanned', 'template'));

ALTER TABLE utility_bills
  ADD COLUMN scan_confidence JSONB;

ALTER TABLE utility_bills
  ADD COLUMN scan_image_url TEXT;

-- Private storage bucket for scanned utility bill images
-- Path convention: {property_id}/{timestamp}.{ext}
INSERT INTO storage.buckets (id, name, public)
VALUES ('utility-scans', 'utility-scans', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: landlords can INSERT scans only under their own property folder
CREATE POLICY utility_scans_landlord_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'utility-scans'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM properties WHERE landlord_id = get_my_profile_id()
    )
  );

-- Storage RLS: landlords can SELECT scans only from their own property folder
CREATE POLICY utility_scans_landlord_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'utility-scans'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM properties WHERE landlord_id = get_my_profile_id()
    )
  );

-- No UPDATE/DELETE policies for users — deletion happens via scheduled cleanup only.

-- Cleanup function: deletes storage objects older than 24 hours
-- and nullifies scan_image_url for orphaned references.
-- Confidence JSONB is preserved for audit.
CREATE OR REPLACE FUNCTION cleanup_old_utility_scans()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'utility-scans'
    AND created_at < now() - interval '24 hours';

  UPDATE utility_bills
  SET scan_image_url = NULL
  WHERE scan_image_url IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM storage.objects
      WHERE bucket_id = 'utility-scans'
        AND name = utility_bills.scan_image_url
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron note: schedule this daily via Supabase Dashboard > Database > Cron Jobs
--
-- Name: cleanup-utility-scans
-- Schedule: 0 3 * * *  (3am MYT = 7pm UTC)
-- Command: SELECT cleanup_old_utility_scans();
