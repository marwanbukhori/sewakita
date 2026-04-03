-- Invite tokens table for tenant self-registration
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  email TEXT,
  agreed_rent NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL DEFAULT 0,
  move_in DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_room ON invites(room_id);
CREATE INDEX idx_invites_status ON invites(status);

-- RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Landlords manage their own invites
CREATE POLICY invites_landlord_all ON invites
  FOR ALL USING (landlord_id = get_my_profile_id());

-- Anyone can read invites by token (the token itself is the secret)
CREATE POLICY invites_public_read ON invites
  FOR SELECT USING (true);
