/*
# Evidence Count, Storage Bucket, and Participation Constraints

1. Adds evidence_count column to issues with trigger
2. Creates storage bucket for evidence files
3. Adds unique constraints to prevent duplicate participation
4. Adds indexes for performance
*/

-- ============================================
-- 1. EVIDENCE_COUNT COLUMN + TRIGGER
-- ============================================
ALTER TABLE issues ADD COLUMN IF NOT EXISTS evidence_count int NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_issues_evidence_count ON issues(evidence_count DESC);

CREATE OR REPLACE FUNCTION public.update_evidence_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE issues SET evidence_count = evidence_count + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE issues SET evidence_count = GREATEST(0, evidence_count - 1) WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_evidence_count ON issue_evidence;
CREATE TRIGGER trg_update_evidence_count
  AFTER INSERT OR DELETE ON issue_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_evidence_count();

REVOKE EXECUTE ON FUNCTION public.update_evidence_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_evidence_count() TO service_role;

-- Protect evidence_count from direct writes
REVOKE UPDATE (evidence_count) ON issues FROM anon, authenticated;
REVOKE INSERT (evidence_count) ON issues FROM anon, authenticated;

-- ============================================
-- 2. STORAGE BUCKET FOR EVIDENCE
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-evidence', 'issue-evidence', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'issue-evidence');

DROP POLICY IF EXISTS "Public can read evidence files" ON storage.objects;
CREATE POLICY "Public can read evidence files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'issue-evidence');

DROP POLICY IF EXISTS "Users can delete own evidence files" ON storage.objects;
CREATE POLICY "Users can delete own evidence files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'issue-evidence' AND owner = auth.uid());

-- ============================================
-- 3. UNIQUE CONSTRAINTS ON PARTICIPATION TABLES
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'issue_supporters_issue_user_unique') THEN
    ALTER TABLE issue_supporters ADD CONSTRAINT issue_supporters_issue_user_unique UNIQUE (issue_id, user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'issue_followers_issue_user_unique') THEN
    ALTER TABLE issue_followers ADD CONSTRAINT issue_followers_issue_user_unique UNIQUE (issue_id, user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solution_votes_solution_user_unique') THEN
    ALTER TABLE solution_votes ADD CONSTRAINT solution_votes_solution_user_unique UNIQUE (solution_id, user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resolution_verif_issue_user_unique') THEN
    ALTER TABLE resolution_verifications ADD CONSTRAINT resolution_verif_issue_user_unique UNIQUE (issue_id, user_id);
  END IF;
END $$;

-- ============================================
-- 4. ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_locality_id ON issues(locality_id);
CREATE INDEX IF NOT EXISTS idx_issues_ward_id ON issues(ward_id);
CREATE INDEX IF NOT EXISTS idx_issues_resolved_at ON issues(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_status_created ON issues(status, created_at DESC);
