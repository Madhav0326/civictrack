/*
# Notifications, Moderation, and Audit Logs

1. Overview
   This migration creates:
   - `notifications`: User notifications for issue updates, comments, moderation actions, etc.
   - `reports`: User-submitted reports for issues, comments, solutions, evidence, or users.
   - `moderation_actions`: Log of every moderation action taken by moderators/admins.
   - `audit_logs`: System-wide audit trail of significant platform events.

2. New Tables
   - `notifications`: (user_id, type, title, body, issue_id, comment_id, is_read, created_at).
     Types: status_update, new_comment, issue_reopened, resolution_verified, moderation_action, followed_issue, new_follower, solution_posted, comment_reply, platform.
   - `reports`: (reporter_id, target_type, target_id, reason, description, status).
     target_type: issue, comment, solution, evidence, user.
     status: pending, reviewed, action_taken, dismissed.
   - `moderation_actions`: (moderator_id, action_type, target_type, target_id, reason, notes).
   - `audit_logs`: (actor_id, action, entity_type, entity_id, details jsonb, ip_address).

3. Security
   - Notifications: users can only read/update own notifications (authenticated only).
   - Reports: users can insert own reports; users can read own reports; moderators can read all.
   - Moderation actions: moderators/admins can read; insert via service role or moderator.
   - Audit logs: admin-only read; insert via service role.

4. Notes
   - Notification preferences are stored in the profiles table (could be extended).
   - Every moderation action is logged for accountability.
   - Audit logs capture system-level events for compliance and security review.
*/

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TYPE notification_type AS ENUM (
  'status_update', 'new_comment', 'issue_reopened', 'resolution_verified',
  'moderation_action', 'followed_issue_update', 'new_follower',
  'solution_posted', 'comment_reply', 'platform', 'issue_supported'
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text,
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES issue_comments(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================
-- REPORTS (user-submitted content reports)
-- ============================================
CREATE TYPE report_target_type AS ENUM ('issue', 'comment', 'solution', 'evidence', 'user');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'action_taken', 'dismissed');

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type report_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can submit reports" ON reports;
CREATE POLICY "Users can submit reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);

-- ============================================
-- MODERATION ACTIONS
-- ============================================
CREATE TYPE moderation_action_type AS ENUM (
  'hide_issue', 'unhide_issue', 'hide_comment', 'unhide_comment',
  'hide_solution', 'unhide_solution', 'delete_evidence',
  'suspend_user', 'ban_user', 'unsuspend_user', 'unban_user',
  'change_status', 'restrict_sensitive_issue', 'dismiss_report', 'action_taken_report',
  'merge_issue', 'feature_issue', 'unfeature_issue'
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type moderation_action_type NOT NULL,
  target_type report_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason text,
  notes text,
  report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can view moderation actions" ON moderation_actions;
CREATE POLICY "Moderators can view moderation actions"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'admin'))
  );

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator_id ON moderation_actions(moderator_id);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
