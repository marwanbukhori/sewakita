-- Missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_log_property ON notification_log(property_id);
CREATE INDEX IF NOT EXISTS idx_activity_unread ON activity_log(landlord_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_invites_room_status ON invites(room_id, status);

-- Auto-expire old invites function
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE invites SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
