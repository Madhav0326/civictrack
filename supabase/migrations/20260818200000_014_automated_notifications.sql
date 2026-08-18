/*
# Automated Workflow Notifications & RLS Hardening

1. Overview
   This migration hardens `notifications` security by revoking direct client INSERT privileges,
   and implements database-level triggers and RPC functions to generate notifications automatically
   for key citizen and authority lifecycle events.

2. Security Hardening
   - REVOKE INSERT on `notifications` from `anon` and `authenticated`.
   - Notifications are strictly generated server-side by database triggers and `SECURITY DEFINER` functions.

3. Automated Notification Triggers
   - `trg_notify_new_issue`: Notifies reporter when a new issue is filed.
   - `trg_notify_new_comment`: Notifies reporter & followers when a comment or official progress update is posted.
   - `trg_notify_resolution_verif`: Notifies moderators/admins when a citizen verifies a resolution.
   - `admin_update_issue_status` (RPC): Notifies reporter & followers when an authority updates an issue status.
   - `admin_assign_issue` (RPC): Notifies assigned official when an issue is assigned to them.
*/

-- ============================================================
-- 1. NOTIFICATIONS SECURITY HARDENING
-- ============================================================
REVOKE INSERT ON notifications FROM anon, authenticated;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;

-- ============================================================
-- 2. TRIGGER: NOTIFY ON NEW ISSUE SUBMISSION
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_issue_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, issue_id, actor_id)
  VALUES (
    NEW.user_id,
    'platform',
    'Issue Submitted Successfully',
    'Your civic report (' || NEW.public_id || ') has been filed and is open for community verification.',
    NEW.id,
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_issue ON issues;
CREATE TRIGGER trg_notify_new_issue
  AFTER INSERT ON issues
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_issue_submitted();

-- ============================================================
-- 3. TRIGGER: NOTIFY ON NEW COMMENT / OFFICIAL UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue_owner_id uuid;
  v_public_id text;
  v_follower RECORD;
BEGIN
  -- Fetch issue metadata
  SELECT user_id, public_id INTO v_issue_owner_id, v_public_id
  FROM issues WHERE id = NEW.issue_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.is_official THEN
    -- Official Authority Update: Notify reporter if different from commenter
    IF v_issue_owner_id IS NOT NULL AND v_issue_owner_id <> NEW.user_id THEN
      INSERT INTO notifications (user_id, type, title, body, issue_id, comment_id, actor_id)
      VALUES (
        v_issue_owner_id,
        'status_update',
        'Official Authority Update',
        'An official progress update was posted on your issue (' || v_public_id || ').',
        NEW.issue_id,
        NEW.id,
        NEW.user_id
      );
    END IF;

    -- Notify issue followers (excluding commenter and owner)
    FOR v_follower IN
      SELECT user_id FROM issue_followers
      WHERE issue_id = NEW.issue_id AND user_id <> NEW.user_id AND user_id <> v_issue_owner_id
    LOOP
      INSERT INTO notifications (user_id, type, title, body, issue_id, comment_id, actor_id)
      VALUES (
        v_follower.user_id,
        'followed_issue_update',
        'Official Update on Followed Issue',
        'An official progress update was posted on followed issue (' || v_public_id || ').',
        NEW.issue_id,
        NEW.id,
        NEW.user_id
      );
    END LOOP;
  ELSE
    -- Citizen Comment: Notify reporter if different from commenter
    IF v_issue_owner_id IS NOT NULL AND v_issue_owner_id <> NEW.user_id THEN
      INSERT INTO notifications (user_id, type, title, body, issue_id, comment_id, actor_id)
      VALUES (
        v_issue_owner_id,
        'new_comment',
        'New Comment on Your Issue',
        'A community member commented on your reported issue (' || v_public_id || ').',
        NEW.issue_id,
        NEW.id,
        NEW.user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_comment ON issue_comments;
CREATE TRIGGER trg_notify_new_comment
  AFTER INSERT ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();

-- ============================================================
-- 4. TRIGGER: NOTIFY MODERATORS ON RESOLUTION VERIFICATION
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_resolution_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_public_id text;
  v_mod RECORD;
BEGIN
  SELECT public_id INTO v_public_id FROM issues WHERE id = NEW.issue_id;

  FOR v_mod IN
    SELECT id FROM profiles WHERE role IN ('admin', 'moderator')
  LOOP
    INSERT INTO notifications (user_id, type, title, body, issue_id, actor_id)
    VALUES (
      v_mod.id,
      'resolution_verified',
      'Citizen Resolution Verification',
      'A citizen verified issue (' || v_public_id || ') as ' || (CASE WHEN NEW.is_resolved THEN 'RESOLVED' ELSE 'UNRESOLVED' END) || '.',
      NEW.issue_id,
      NEW.user_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_resolution_verif ON resolution_verifications;
CREATE TRIGGER trg_notify_resolution_verif
  AFTER INSERT ON resolution_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_resolution_verification();

-- ============================================================
-- 5. UPDATE ADMIN STATUS RPC: NOTIFY REPORTER & FOLLOWERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_issue_status(
  p_issue_id uuid,
  p_new_status issue_status,
  p_note text DEFAULT NULL,
  p_department text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_old_status issue_status;
  v_user_id uuid;
  v_public_id text;
  v_follower RECORD;
BEGIN
  -- Verify caller role
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: Moderator or Administrator privileges required.';
  END IF;

  -- Get current issue details
  SELECT status, user_id, public_id INTO v_old_status, v_user_id, v_public_id
  FROM issues WHERE id = p_issue_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found.';
  END IF;

  -- Update issue status
  UPDATE issues
  SET
    status = p_new_status,
    resolved_at = CASE WHEN p_new_status = 'resolved' THEN now() ELSE resolved_at END,
    department_name = COALESCE(p_department, department_name),
    updated_at = now()
  WHERE id = p_issue_id;

  -- Log moderation action
  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason, notes)
  VALUES (
    auth.uid(),
    'change_status',
    'issue',
    p_issue_id,
    COALESCE(p_note, 'Status updated to ' || p_new_status::text),
    'Status changed from ' || v_old_status::text || ' to ' || p_new_status::text
  );

  -- Write audit log
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'issue_status_change',
    'issue',
    p_issue_id,
    jsonb_build_object('old_status', v_old_status, 'new_status', p_new_status, 'note', p_note)
  );

  -- Notify reporter
  IF v_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, issue_id, actor_id)
    VALUES (
      v_user_id,
      'status_update',
      'Issue Status Updated',
      'Your issue (' || v_public_id || ') status has been updated to ' || REPLACE(p_new_status::text, '_', ' ') || '.',
      p_issue_id,
      auth.uid()
    );
  END IF;

  -- Notify issue followers (excluding reporter)
  FOR v_follower IN
    SELECT user_id FROM issue_followers
    WHERE issue_id = p_issue_id AND user_id <> v_user_id
  LOOP
    INSERT INTO notifications (user_id, type, title, body, issue_id, actor_id)
    VALUES (
      v_follower.user_id,
      'followed_issue_update',
      'Followed Issue Status Updated',
      'Followed issue (' || v_public_id || ') status has been updated to ' || REPLACE(p_new_status::text, '_', ' ') || '.',
      p_issue_id,
      auth.uid()
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 6. UPDATE ADMIN ASSIGN ISSUE RPC: NOTIFY ASSIGNED OFFICIAL
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_assign_issue(
  p_issue_id uuid,
  p_department text,
  p_assignee_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_public_id text;
  v_title text;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: Moderator or Administrator privileges required.';
  END IF;

  SELECT public_id, title INTO v_public_id, v_title FROM issues WHERE id = p_issue_id;

  UPDATE issues
  SET department_name = p_department, assigned_to = p_assignee_id, updated_at = now()
  WHERE id = p_issue_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'assign_issue', 'issue', p_issue_id, jsonb_build_object('department', p_department, 'assignee_id', p_assignee_id));

  -- Notify assigned official if assignee provided
  IF p_assignee_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, issue_id, actor_id)
    VALUES (
      p_assignee_id,
      'platform',
      'Issue Assigned to You',
      'You have been assigned to handle issue ' || v_public_id || ' (' || v_title || '). Department: ' || p_department,
      p_issue_id,
      auth.uid()
    );
  END IF;
END;
$$;
