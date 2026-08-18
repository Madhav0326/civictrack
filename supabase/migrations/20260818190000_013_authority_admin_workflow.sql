/*
# Authority & Admin Workflow Schema & Security Infrastructure

1. Overview
   This migration establishes the database infrastructure for authority issue management,
   status transitions, assignments, official progress updates, moderation, and audit logging.

2. New Columns & Permissions
   - Adds `assigned_to` and `department_name` to `issues`.
   - Adds `is_official` to `issue_comments` for distinguishing authority progress updates.
   - Revokes direct UPDATE on `assigned_to` and `department_name` from authenticated users.

3. SECURITY DEFINER RPC Functions
   - `admin_update_issue_status`: Validates caller is moderator/admin, updates issue status & resolution date, logs moderation action, writes audit record, and notifies citizen reporter.
   - `admin_toggle_issue_hidden`: Hides/unhides an issue with moderation log.
   - `admin_assign_issue`: Assigns an issue to a department or official with audit record.
*/

-- ============================================================
-- 1. COLUMNS ADDITIONS & PRIVILEGES
-- ============================================================
ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS department_name text;
ALTER TABLE issue_comments ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_department_name ON issues(department_name);

REVOKE UPDATE (assigned_to, department_name) ON issues FROM anon, authenticated;
GRANT SELECT (assigned_to, department_name) ON issues TO anon, authenticated;

-- ============================================================
-- 2. SECURITY DEFINER RPC: ADMIN UPDATE STATUS
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
  INSERT INTO notifications (user_id, type, title, body, issue_id, actor_id)
  VALUES (
    v_user_id,
    'status_update',
    'Issue status updated',
    'Your issue (' || v_public_id || ') status has been updated to ' || REPLACE(p_new_status::text, '_', ' ') || '.',
    p_issue_id,
    auth.uid()
  );
END;
$$;

-- ============================================================
-- 3. SECURITY DEFINER RPC: ADMIN TOGGLE HIDE ISSUE
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_toggle_issue_hidden(
  p_issue_id uuid,
  p_hide boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: Moderator or Administrator privileges required.';
  END IF;

  UPDATE issues SET is_hidden = p_hide, updated_at = now() WHERE id = p_issue_id;

  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), CASE WHEN p_hide THEN 'hide_issue' ELSE 'unhide_issue' END::moderation_action_type, 'issue', p_issue_id, p_reason);

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), CASE WHEN p_hide THEN 'hide_issue' ELSE 'unhide_issue' END, 'issue', p_issue_id, jsonb_build_object('reason', p_reason));
END;
$$;

-- ============================================================
-- 4. SECURITY DEFINER RPC: ADMIN ASSIGN ISSUE
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
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: Moderator or Administrator privileges required.';
  END IF;

  UPDATE issues
  SET department_name = p_department, assigned_to = p_assignee_id, updated_at = now()
  WHERE id = p_issue_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'assign_issue', 'issue', p_issue_id, jsonb_build_object('department', p_department, 'assignee_id', p_assignee_id));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_issue_status(uuid, issue_status, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_issue_hidden(uuid, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_assign_issue(uuid, text, uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.admin_update_issue_status(uuid, issue_status, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_issue_hidden(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_issue(uuid, text, uuid) TO authenticated;
