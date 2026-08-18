/*
# Security Hardening Part 2: Table-Level Privilege Restriction

1. Overview
   The previous migration tried column-level REVOKE, but Supabase grants table-level
   UPDATE/INSERT to anon and authenticated, which overrides column-level restrictions.
   This migration takes the correct approach: REVOKE table-level UPDATE/INSERT, then
   GRANT column-level UPDATE/INSERT only on safe columns.

2. Tables Fixed
   - profiles: Revoke table UPDATE, grant UPDATE only on username, full_name, avatar_url, bio, is_private
   - issues: Revoke table UPDATE/INSERT, grant UPDATE on user-editable columns only,
     grant INSERT on user-insertable columns only
   - issue_comments: Revoke table UPDATE/INSERT, grant on safe columns only
   - issue_solutions: Revoke table UPDATE/INSERT, grant on safe columns only

3. Protected Columns (no longer writable by anon/authenticated)
   - profiles: role, is_suspended, is_banned
   - issues: is_hidden, is_sensitive_hidden, supporter_count, comment_count, solution_count, follower_count
   - issue_comments: is_hidden
   - issue_solutions: is_hidden, vote_count
*/

-- ============================================
-- PROFILES: Restrict to safe columns only
-- ============================================
REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT UPDATE (username, full_name, avatar_url, bio, is_private) ON profiles TO anon, authenticated;

REVOKE INSERT ON profiles FROM anon, authenticated;
GRANT INSERT (id, username, full_name, avatar_url, bio, is_private) ON profiles TO anon, authenticated;

-- ============================================
-- ISSUES: Restrict to safe columns only
-- ============================================
REVOKE UPDATE ON issues FROM anon, authenticated;
GRANT UPDATE (
  title, description, severity, status, subcategory_id,
  state_id, district_id, city_id, ward_id, locality_id,
  address, latitude, longitude, pincode, location_privacy,
  date_started, frequency, people_affected_estimate, reference_number,
  is_sensitive, resolved_at
) ON issues TO anon, authenticated;

REVOKE INSERT ON issues FROM anon, authenticated;
GRANT INSERT (
  id, public_id, user_id, category_id, subcategory_id,
  title, description, severity, status,
  state_id, district_id, city_id, ward_id, locality_id,
  address, latitude, longitude, pincode, location_privacy,
  date_started, frequency, people_affected_estimate, reference_number,
  is_sensitive, created_at, updated_at
) ON issues TO anon, authenticated;

-- ============================================
-- ISSUE COMMENTS: Restrict to safe columns only
-- ============================================
REVOKE UPDATE ON issue_comments FROM anon, authenticated;
GRANT UPDATE (body, is_deleted) ON issue_comments TO anon, authenticated;

REVOKE INSERT ON issue_comments FROM anon, authenticated;
GRANT INSERT (id, issue_id, user_id, parent_id, body, is_deleted, created_at, updated_at) ON issue_comments TO anon, authenticated;

-- ============================================
-- ISSUE SOLUTIONS: Restrict to safe columns only
-- ============================================
REVOKE UPDATE ON issue_solutions FROM anon, authenticated;
GRANT UPDATE (title, description) ON issue_solutions TO anon, authenticated;

REVOKE INSERT ON issue_solutions FROM anon, authenticated;
GRANT INSERT (id, issue_id, user_id, title, description, created_at, updated_at) ON issue_solutions TO anon, authenticated;

-- ============================================
-- REVOKE EXECUTE on SECURITY DEFINER functions from anon and authenticated
-- ============================================
-- These are internal functions triggered by the database, not callable via API
REVOKE EXECUTE ON FUNCTION public.generate_issue_public_id(smallint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_status_change() FROM anon, authenticated;
