/*
# Issues, Evidence, Status History

1. Overview
   This migration creates the core issue tables:
   - `issues`: The main civic issue records with location, category, status, severity.
   - `issue_evidence`: File evidence (photos, videos, documents) attached to issues.
   - `issue_status_history`: Full lifecycle tracking of status changes per issue.

2. New Tables
   - `issues`: Main issue record. Includes title, description, category/subcategory refs,
     geographic refs (state through locality), lat/lng, severity, status, privacy flags,
     supporter count, comment count, solution count, and timestamps.
   - `issue_evidence`: One row per uploaded file linked to an issue. Stores storage path,
     file type, and caption.
   - `issue_status_history`: Append-only log of every status change with optional note
     and the user who made the change.

3. Security
   - RLS enabled on all tables.
   - Issues: public SELECT (anon can read non-hidden issues). INSERT/UPDATE/DELETE by owner only.
   - Evidence: public SELECT for non-hidden issues. INSERT/DELETE by issue owner only.
   - Status history: public SELECT. INSERT by issue owner (and later admin/moderator via service role).

4. Notes
   - `public_id` is a human-readable issue code like CIV-AP-VSK-000123 generated via a sequence.
   - `is_hidden` allows moderators to hide issues from public view without deleting.
   - `is_sensitive` flags corruption/integrity reports for restricted visibility.
   - `location_privacy` controls whether exact coordinates are shown publicly.
   - Status enum: reported, under_review, acknowledged, in_progress, resolved, reopened, closed.
   - Severity enum: low, medium, high, critical.
*/

-- ============================================
-- ISSUES
-- ============================================
CREATE TYPE issue_status AS ENUM ('reported', 'under_review', 'acknowledged', 'in_progress', 'resolved', 'reopened', 'closed');
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE location_privacy_level AS ENUM ('exact', 'approximate', 'area_only');

CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id smallint NOT NULL REFERENCES categories(id),
  subcategory_id smallint REFERENCES subcategories(id),
  title text NOT NULL,
  description text NOT NULL,
  severity issue_severity NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'reported',
  state_id smallint REFERENCES geo_states(id),
  district_id int REFERENCES geo_districts(id),
  city_id int REFERENCES geo_cities(id),
  ward_id int REFERENCES geo_wards(id),
  locality_id int REFERENCES geo_localities(id),
  address text,
  latitude double precision,
  longitude double precision,
  pincode text,
  location_privacy location_privacy_level NOT NULL DEFAULT 'approximate',
  date_started date,
  frequency text,
  people_affected_estimate int,
  reference_number text,
  is_sensitive boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  is_sensitive_hidden boolean NOT NULL DEFAULT false,
  supporter_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  solution_count int NOT NULL DEFAULT 0,
  follower_count int NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view non-hidden issues" ON issues;
CREATE POLICY "Public can view non-hidden issues"
  ON issues FOR SELECT
  TO anon, authenticated
  USING (
    (NOT is_hidden)
    AND (
      NOT is_sensitive
      OR (
        is_sensitive AND NOT is_sensitive_hidden
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert own issues" ON issues;
CREATE POLICY "Users can insert own issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own issues" ON issues;
CREATE POLICY "Users can update own issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own issues" ON issues;
CREATE POLICY "Users can delete own issues"
  ON issues FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category_id ON issues(category_id);
CREATE INDEX IF NOT EXISTS idx_issues_state_id ON issues(state_id);
CREATE INDEX IF NOT EXISTS idx_issues_district_id ON issues(district_id);
CREATE INDEX IF NOT EXISTS idx_issues_city_id ON issues(city_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_public_id ON issues(public_id);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_supporter_count ON issues(supporter_count DESC);
CREATE INDEX IF NOT EXISTS idx_issues_not_hidden ON issues(is_hidden, is_sensitive, is_sensitive_hidden);

-- ============================================
-- ISSUE EVIDENCE
-- ============================================
CREATE TYPE evidence_type AS ENUM ('image', 'video', 'document');

CREATE TABLE IF NOT EXISTS issue_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type evidence_type NOT NULL,
  file_name text,
  file_size bigint,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view evidence for visible issues" ON issue_evidence;
CREATE POLICY "Public can view evidence for visible issues"
  ON issue_evidence FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_evidence.issue_id
      AND NOT issues.is_hidden
      AND (NOT issues.is_sensitive OR NOT issues.is_sensitive_hidden)
    )
  );

DROP POLICY IF EXISTS "Users can add evidence to own issues" ON issue_evidence;
CREATE POLICY "Users can add evidence to own issues"
  ON issue_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND issues.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own evidence" ON issue_evidence;
CREATE POLICY "Users can delete own evidence"
  ON issue_evidence FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_issue_evidence_issue_id ON issue_evidence(issue_id);

-- ============================================
-- ISSUE STATUS HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS issue_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_status issue_status,
  new_status issue_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Status history is publicly viewable" ON issue_status_history;
CREATE POLICY "Status history is publicly viewable"
  ON issue_status_history FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can add status history to own issues" ON issue_status_history;
CREATE POLICY "Users can add status history to own issues"
  ON issue_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND issues.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_issue_status_history_issue_id ON issue_status_history(issue_id, created_at DESC);

-- ============================================
-- PUBLIC ID GENERATION SEQUENCE & FUNCTION
-- ============================================
CREATE SEQUENCE IF NOT EXISTS issue_public_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_issue_public_id(p_state_id smallint)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq bigint;
  v_state_code text;
  v_district_code text;
  v_result text;
BEGIN
  SELECT nextval('issue_public_id_seq') INTO v_seq;
  SELECT code INTO v_state_code FROM geo_states WHERE id = p_state_id;
  v_state_code := COALESCE(UPPER(LEFT(v_state_code, 2)), 'IN');
  v_result := 'CIV-' || v_state_code || '-' || lpad(v_seq::text, 6, '0');
  RETURN v_result;
END;
$$;

-- ============================================
-- TRIGGERS: updated_at on issues
-- ============================================
DROP TRIGGER IF EXISTS issues_updated_at ON issues;
CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
