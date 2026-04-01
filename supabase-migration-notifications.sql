-- ============================================================
-- Minus1 — Notifications migration
-- Run in Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- 'team_invite' | 'match_request' | 'match_waiting' | 'checklist_assignment' | 'admin_message'
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Any authenticated user can insert (needed to notify other users)
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_notifications_profile_unread
  ON notifications(profile_id, read) WHERE NOT read;

CREATE INDEX IF NOT EXISTS idx_notifications_profile_created
  ON notifications(profile_id, created_at DESC);

-- ── Realtime ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

NOTIFY pgrst, 'reload schema';
