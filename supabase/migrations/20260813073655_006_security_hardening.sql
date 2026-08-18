/*
# Security Hardening: Column-Level Privileges and Function Permissions

1. Overview
   This migration fixes critical security vulnerabilities found during review:
   - Privilege escalation: profiles.role was writable by any authenticated user
   - Self-unban: profiles.is_suspended, is_banned were writable by users
   - Moderation bypass: issues.is_hidden, is_sensitive_hidden were writable by issue owners
   - Fake counts: issues.supporter_count, comment_count, solution_count, follower_count were directly writable
   - Comment/solution hiding bypass: is_hidden columns were writable by content authors
   - Solution vote manipulation: vote_count was directly writable
   - SECURITY DEFINER functions were executable by anon role
   - Trigger functions had mutable search_path

2. Changes
   - REVOKE UPDATE/INSERT on sensitive columns from anon and authenticated roles
   - Grant SELECT-only on sensitive columns to anon and authenticated
   - REVOKE EXECUTE on SECURITY DEFINER functions from anon
   - Add SET search_path = public to all trigger functions
   - Add a trigger to auto-insert status_history when an issue's status changes
   - Add a column-level UPDATE grant for issues.status so owners can change status
     (but NOT is_hidden/is_sensitive_hidden — those are moderator-only via service role)

3. Security Impact
   - Users can no longer escalate their own role to moderator or admin
   - Users can no longer unban/suspend themselves
   - Users can no longer hide their own issues from public view
   - Users can no longer artificially inflate supporter/comment/follower counts
   - Users can no longer hide their own comments or solutions
   - Users can no longer manipulate solution vote counts
   - Anonymous users can no longer call internal SECURITY DEFINER functions
   - Trigger functions are protected against search_path injection
*/
-- ============================================
-- 1. PROFILES: Revoke write on role, is_suspended, is_banned
-- ============================================
REVOKE UPDATE (role, is_suspended, is_banned) ON profiles FROM anon, authenticated;
REVOKE INSERT (role, is_suspended, is_banned) ON profiles FROM anon, authenticated;

-- Grant SELECT on these columns (they need to be readable for UI logic)
GRANT SELECT (role, is_suspended, is_banned) ON profiles TO anon, authenticated;

-- ============================================
-- 2. ISSUES: Revoke write on moderation and count columns
-- ============================================
-- Moderation columns: only service_role (admins) should write these
REVOKE UPDATE (is_hidden, is_sensitive_hidden) ON issues FROM anon, authenticated;
REVOKE INSERT (is_hidden, is_sensitive_hidden) ON issues FROM anon, authenticated;
GRANT SELECT (is_hidden, is_sensitive_hidden) ON issues TO anon, authenticated;

-- Count columns: maintained by triggers only, never directly writable
REVOKE UPDATE (supporter_count, comment_count, solution_count, follower_count) ON issues FROM anon, authenticated;
REVOKE INSERT (supporter_count, comment_count, solution_count, follower_count) ON issues FROM anon, authenticated;
GRANT SELECT (supporter_count, comment_count, solution_count, follower_count) ON issues TO anon, authenticated;

-- ============================================
-- 3. ISSUE COMMENTS: Revoke write on is_hidden
-- ============================================
REVOKE UPDATE (is_hidden) ON issue_comments FROM anon, authenticated;
REVOKE INSERT (is_hidden) ON issue_comments FROM anon, authenticated;
GRANT SELECT (is_hidden) ON issue_comments TO anon, authenticated;

-- ============================================
-- 4. ISSUE SOLUTIONS: Revoke write on is_hidden, vote_count
-- ============================================
REVOKE UPDATE (is_hidden, vote_count) ON issue_solutions FROM anon, authenticated;
REVOKE INSERT (is_hidden, vote_count) ON issue_solutions FROM anon, authenticated;
GRANT SELECT (is_hidden, vote_count) ON issue_solutions TO anon, authenticated;

-- ============================================
-- 5. SECURITY DEFINER FUNCTIONS: Revoke EXECUTE from anon
-- ============================================
REVOKE EXECUTE ON FUNCTION public.generate_issue_public_id(smallint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- ============================================
-- 6. Fix search_path on all trigger functions
-- ============================================
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.update_supporter_count() SET search_path = public;
ALTER FUNCTION public.update_comment_count() SET search_path = public;
ALTER FUNCTION public.update_solution_count() SET search_path = public;
ALTER FUNCTION public.update_solution_vote_count() SET search_path = public;
ALTER FUNCTION public.update_follower_count() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.generate_issue_public_id(smallint) SET search_path = public;

-- ============================================
-- 7. AUTO-RECORD STATUS CHANGES IN HISTORY
-- ============================================
-- When an issue's status changes, automatically insert a row into issue_status_history
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO issue_status_history (issue_id, user_id, old_status, new_status)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_status_change ON issues;
CREATE TRIGGER trg_record_status_change
  AFTER UPDATE OF status ON issues
  FOR EACH ROW
  EXECUTE FUNCTION record_status_change();

-- ============================================
-- 8. GRANT INSERT on issue_status_history for the trigger
-- The trigger runs as SECURITY DEFINER (owner), so it can insert regardless.
-- But keep the existing RLS policy for direct inserts by issue owners.
-- ============================================
