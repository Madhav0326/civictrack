/*
# Secure Issue Lifecycle & RLS Hardening

1. Overview
   This migration hardens database-level security and column-level privileges across the
   entire issue lifecycle:
   - Revokes UPDATE privileges on authority-controlled columns (`status`, `resolved_at`, `public_id`,
     `created_at`, `user_id`, `is_sensitive`, `is_hidden`, `is_sensitive_hidden`, `evidence_count`, etc.)
     from `anon` and `authenticated` roles.
   - Restricts `issues` UPDATE policy so owners can only edit allowed non-authority fields while issue is in editable statuses.
   - Restricts `issues` DELETE policy so owners can only delete issues while in `reported` status before processing.
   - Revokes INSERT/UPDATE/DELETE on `issue_status_history` from `anon` and `authenticated` to prevent status history forgery.
   - Restricts `issue-evidence` storage policies so users can ONLY upload/delete files inside their own user folder (`<user_id>/...`).
   - Ensures `resolution_verifications` can only be submitted for active verification issues.
*/

-- ============================================================
-- 1. ISSUES: COLUMN-LEVEL PRIVILEGE HARDENING
-- ============================================================
REVOKE UPDATE (status, resolved_at, public_id, created_at, user_id, is_sensitive, is_hidden, is_sensitive_hidden, supporter_count, comment_count, solution_count, follower_count, evidence_count) ON issues FROM anon, authenticated;
GRANT SELECT (status, resolved_at, public_id, created_at, user_id, is_sensitive, is_hidden, is_sensitive_hidden, supporter_count, comment_count, solution_count, follower_count, evidence_count) ON issues TO anon, authenticated;

-- UPDATE policy on issues: owners can update non-authority fields only while status is editable
DROP POLICY IF EXISTS "Users can update own issues" ON issues;
CREATE POLICY "Users can update own issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('reported', 'under_review', 'acknowledged', 'reopened')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('reported', 'under_review', 'acknowledged', 'reopened')
  );

-- DELETE policy on issues: owners can delete issues only while in reported status
DROP POLICY IF EXISTS "Users can delete own issues" ON issues;
DROP POLICY IF EXISTS "Users can delete own issues in reported status" ON issues;
CREATE POLICY "Users can delete own issues in reported status"
  ON issues FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'reported'
  );

-- ============================================================
-- 2. STATUS HISTORY: PREVENT FORGERY
-- ============================================================
REVOKE INSERT, UPDATE, DELETE ON issue_status_history FROM anon, authenticated;
GRANT SELECT ON issue_status_history TO anon, authenticated;

DROP POLICY IF EXISTS "Users can add status history to own issues" ON issue_status_history;

-- ============================================================
-- 3. EVIDENCE STORAGE BUCKET: FOLDER OWNERSHIP ENFORCEMENT
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'issue-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own evidence files" ON storage.objects;
CREATE POLICY "Users can delete own evidence files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'issue-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 4. RESOLUTION VERIFICATIONS HARDENING
-- ============================================================
DROP POLICY IF EXISTS "Users can submit verification" ON resolution_verifications;
CREATE POLICY "Users can submit verification"
  ON resolution_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = resolution_verifications.issue_id
      AND issues.status IN ('resolved', 'in_progress', 'acknowledged')
    )
  );

-- ============================================================
-- 5. COMMENTS & SOLUTIONS POLICIES HARDENING
-- ============================================================
-- Ensure comments and solutions can only be edited/deleted by their respective author
DROP POLICY IF EXISTS "Users can update own comments" ON issue_comments;
CREATE POLICY "Users can update own comments"
  ON issue_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON issue_comments;
CREATE POLICY "Users can delete own comments"
  ON issue_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own solutions" ON issue_solutions;
CREATE POLICY "Users can update own solutions"
  ON issue_solutions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own solutions" ON issue_solutions;
CREATE POLICY "Users can delete own solutions"
  ON issue_solutions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
