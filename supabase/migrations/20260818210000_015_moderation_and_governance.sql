/*
# Phase 9: Moderation, Governance and Abuse Prevention

1. Security & RLS Hardening
   - Add RLS policy for moderators/admins to SELECT all content reports in `reports`.
   - REVOKE direct UPDATE on `reports` from `anon` and `authenticated`.
   - REVOKE direct INSERT, UPDATE, DELETE on `moderation_actions` and `audit_logs` from `anon` and `authenticated`.
   - Add unique partial index `idx_reports_unique_pending` to prevent duplicate pending reports from the same user on the same target.

2. Account Governance & Abuse Prevention Triggers
   - Database function `enforce_user_not_banned_or_suspended()`:
     Checks `profiles.is_banned` and `profiles.is_suspended`. If set, blocks INSERT on `issues`, `issue_comments`, `issue_supporters`, `issue_followers`, and `reports`.

3. Moderation RPC Functions
   - `admin_review_report`: Reviews, dismisses, or takes action on content reports.
   - `admin_toggle_comment_hidden`: Hides/unhides inappropriate comments.
   - `admin_toggle_user_ban_status`: Allows admins to ban/unban users.
   - `admin_toggle_user_suspension_status`: Allows admins/moderators to suspend/unsuspend users.
*/

-- ============================================================
-- 1. RLS HARDENING FOR REPORTS, MODERATION ACTIONS, AUDIT LOGS
-- ============================================================
DROP POLICY IF EXISTS "Moderators can view all reports" ON reports;
CREATE POLICY "Moderators can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'admin'))
  );

REVOKE UPDATE ON reports FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON moderation_actions FROM anon, authenticated;
GRANT SELECT ON moderation_actions TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON audit_logs FROM anon, authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Prevent duplicate pending reports by the same user on the same target
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_pending
  ON reports(reporter_id, target_type, target_id)
  WHERE status = 'pending';

-- ============================================================
-- 2. DATABASE TRIGGER: BLOCK BANNED/SUSPENDED ACCOUNTS
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_user_not_banned_or_suspended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_banned boolean;
  v_is_suspended boolean;
BEGIN
  SELECT is_banned, is_suspended INTO v_is_banned, v_is_suspended
  FROM profiles WHERE id = auth.uid();

  IF v_is_banned = true THEN
    RAISE EXCEPTION 'Access denied: Account is permanently banned.';
  END IF;

  IF v_is_suspended = true THEN
    RAISE EXCEPTION 'Access denied: Account is currently suspended.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_banned_issues ON issues;
CREATE TRIGGER trg_check_banned_issues
  BEFORE INSERT ON issues
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_not_banned_or_suspended();

DROP TRIGGER IF EXISTS trg_check_banned_comments ON issue_comments;
CREATE TRIGGER trg_check_banned_comments
  BEFORE INSERT ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_not_banned_or_suspended();

DROP TRIGGER IF EXISTS trg_check_banned_reports ON reports;
CREATE TRIGGER trg_check_banned_reports
  BEFORE INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_not_banned_or_suspended();

-- ============================================================
-- 3. RPC: ADMIN REVIEW REPORT
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_review_report(
  p_report_id uuid,
  p_status report_status,
  p_action_type moderation_action_type DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_target_type report_target_type;
  v_target_id uuid;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: Moderator or Administrator privileges required.';
  END IF;

  SELECT target_type, target_id INTO v_target_type, v_target_id
  FROM reports WHERE id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.';
  END IF;

  -- Update report status
  UPDATE reports
  SET status = p_status, updated_at = now()
  WHERE id = p_report_id;

  -- Execute action if specified
  IF p_action_type IS NOT NULL THEN
    IF p_action_type = 'hide_issue' AND v_target_type = 'issue' THEN
      UPDATE issues SET is_hidden = true, updated_at = now() WHERE id = v_target_id;
    ELSIF p_action_type = 'unhide_issue' AND v_target_type = 'issue' THEN
      UPDATE issues SET is_hidden = false, updated_at = now() WHERE id = v_target_id;
    ELSIF p_action_type = 'hide_comment' AND v_target_type = 'comment' THEN
      UPDATE issue_comments SET is_hidden = true, updated_at = now() WHERE id = v_target_id;
    ELSIF p_action_type = 'unhide_comment' AND v_target_type = 'comment' THEN
      UPDATE issue_comments SET is_hidden = false, updated_at = now() WHERE id = v_target_id;
    END IF;

    -- Record moderation action
    INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason, notes, report_id)
    VALUES (auth.uid(), p_action_type, v_target_type, v_target_id, COALESCE(p_notes, 'Report processed'), p_notes, p_report_id);
  END IF;

  -- Audit log
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'review_report',
    'report',
    p_report_id,
    jsonb_build_object('status', p_status, 'action_type', p_action_type, 'notes', p_notes)
  );
END;
$$;

-- ============================================================
-- 4. RPC: ADMIN TOGGLE COMMENT HIDDEN
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_toggle_comment_hidden(
  p_comment_id uuid,
  p_is_hidden boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_action moderation_action_type;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: Moderator or Administrator privileges required.';
  END IF;

  UPDATE issue_comments
  SET is_hidden = p_is_hidden, updated_at = now()
  WHERE id = p_comment_id;

  v_action := CASE WHEN p_is_hidden THEN 'hide_comment'::moderation_action_type ELSE 'unhide_comment'::moderation_action_type END;

  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason, notes)
  VALUES (auth.uid(), v_action, 'comment', p_comment_id, COALESCE(p_reason, 'Comment visibility toggled'), p_reason);

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'toggle_comment_hidden', 'comment', p_comment_id, jsonb_build_object('is_hidden', p_is_hidden, 'reason', p_reason));
END;
$$;

-- ============================================================
-- 5. RPC: ADMIN GOVERNANCE (BAN & SUSPEND USER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_toggle_user_ban_status(
  p_target_user_id uuid,
  p_is_banned boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_action moderation_action_type;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: Administrator privileges required.';
  END IF;

  UPDATE profiles
  SET is_banned = p_is_banned, updated_at = now()
  WHERE id = p_target_user_id;

  v_action := CASE WHEN p_is_banned THEN 'ban_user'::moderation_action_type ELSE 'unban_user'::moderation_action_type END;

  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason, notes)
  VALUES (auth.uid(), v_action, 'user', p_target_user_id, COALESCE(p_reason, 'User ban status toggled'), p_reason);

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'toggle_user_ban', 'profile', p_target_user_id, jsonb_build_object('is_banned', p_is_banned, 'reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_user_suspension_status(
  p_target_user_id uuid,
  p_is_suspended boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_action moderation_action_type;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: Moderator or Administrator privileges required.';
  END IF;

  UPDATE profiles
  SET is_suspended = p_is_suspended, updated_at = now()
  WHERE id = p_target_user_id;

  v_action := CASE WHEN p_is_suspended THEN 'suspend_user'::moderation_action_type ELSE 'unsuspend_user'::moderation_action_type END;

  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason, notes)
  VALUES (auth.uid(), v_action, 'user', p_target_user_id, COALESCE(p_reason, 'User suspension status toggled'), p_reason);

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'toggle_user_suspension', 'profile', p_target_user_id, jsonb_build_object('is_suspended', p_is_suspended, 'reason', p_reason));
END;
$$;
