/*
# Community Participation: Supporters, Comments, Solutions, Followers, Verification

1. Overview
   This migration creates the community engagement layer:
   - `issue_supporters`: "I'm affected too" — one per user per issue.
   - `issue_comments`: Public comments on issues with moderation controls.
   - `issue_solutions`: Citizen-proposed solutions with upvote counts.
   - `solution_votes`: One vote per user per solution (upvote only).
   - `issue_followers`: Follow/bookmark an issue.
   - `resolution_verifications`: "Resolved for me" / "Still not resolved" votes.

2. Security
   - RLS enabled on all tables.
   - SELECT: public for non-hidden content on visible issues.
   - INSERT/DELETE: authenticated users, scoped to own rows.
   - UPDATE: restricted (e.g., users can edit own comments).

3. Notes
   - Triggers maintain denormalized counts on the issues table for performance.
   - Comments support soft-delete (is_deleted) to preserve thread integrity.
   - Solutions are citizen suggestions, not official recommendations.
*/

-- ============================================
-- ISSUE SUPPORTERS (I'm affected too)
-- ============================================
CREATE TABLE IF NOT EXISTS issue_supporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, user_id)
);

ALTER TABLE issue_supporters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view supporters" ON issue_supporters;
CREATE POLICY "Public can view supporters"
  ON issue_supporters FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_supporters.issue_id AND NOT issues.is_hidden AND (NOT issues.is_sensitive OR NOT issues.is_sensitive_hidden))
  );

DROP POLICY IF EXISTS "Users can support issues" ON issue_supporters;
CREATE POLICY "Users can support issues"
  ON issue_supporters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own support" ON issue_supporters;
CREATE POLICY "Users can remove own support"
  ON issue_supporters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_issue_supporters_issue_id ON issue_supporters(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_supporters_user_id ON issue_supporters(user_id);

-- ============================================
-- ISSUE COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS issue_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES issue_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view non-hidden comments" ON issue_comments;
CREATE POLICY "Public can view non-hidden comments"
  ON issue_comments FOR SELECT
  TO anon, authenticated
  USING (
    NOT is_hidden
    AND EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_comments.issue_id AND NOT issues.is_hidden AND (NOT issues.is_sensitive OR NOT issues.is_sensitive_hidden))
  );

DROP POLICY IF EXISTS "Users can comment on issues" ON issue_comments;
CREATE POLICY "Users can comment on issues"
  ON issue_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id, created_at);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user_id ON issue_comments(user_id);

-- ============================================
-- ISSUE SOLUTIONS (Citizen suggestions)
-- ============================================
CREATE TABLE IF NOT EXISTS issue_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  vote_count int NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_solutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view non-hidden solutions" ON issue_solutions;
CREATE POLICY "Public can view non-hidden solutions"
  ON issue_solutions FOR SELECT
  TO anon, authenticated
  USING (
    NOT is_hidden
    AND EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_solutions.issue_id AND NOT issues.is_hidden AND (NOT issues.is_sensitive OR NOT issues.is_sensitive_hidden))
  );

DROP POLICY IF EXISTS "Users can propose solutions" ON issue_solutions;
CREATE POLICY "Users can propose solutions"
  ON issue_solutions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

CREATE INDEX IF NOT EXISTS idx_issue_solutions_issue_id ON issue_solutions(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_solutions_vote_count ON issue_solutions(vote_count DESC);

-- ============================================
-- SOLUTION VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS solution_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid NOT NULL REFERENCES issue_solutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (solution_id, user_id)
);

ALTER TABLE solution_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view votes" ON solution_votes;
CREATE POLICY "Public can view votes"
  ON solution_votes FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can vote on solutions" ON solution_votes;
CREATE POLICY "Users can vote on solutions"
  ON solution_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own vote" ON solution_votes;
CREATE POLICY "Users can remove own vote"
  ON solution_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_solution_votes_solution_id ON solution_votes(solution_id);

-- ============================================
-- ISSUE FOLLOWERS
-- ============================================
CREATE TABLE IF NOT EXISTS issue_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, user_id)
);

ALTER TABLE issue_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own follows" ON issue_followers;
CREATE POLICY "Users can view own follows"
  ON issue_followers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can follow issues" ON issue_followers;
CREATE POLICY "Users can follow issues"
  ON issue_followers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unfollow issues" ON issue_followers;
CREATE POLICY "Users can unfollow issues"
  ON issue_followers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_issue_followers_user_id ON issue_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_followers_issue_id ON issue_followers(issue_id);

-- ============================================
-- RESOLUTION VERIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS resolution_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  is_resolved boolean NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, user_id)
);

ALTER TABLE resolution_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view verifications" ON resolution_verifications;
CREATE POLICY "Public can view verifications"
  ON resolution_verifications FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = resolution_verifications.issue_id AND NOT issues.is_hidden)
  );

DROP POLICY IF EXISTS "Users can submit verification" ON resolution_verifications;
CREATE POLICY "Users can submit verification"
  ON resolution_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own verification" ON resolution_verifications;
CREATE POLICY "Users can update own verification"
  ON resolution_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own verification" ON resolution_verifications;
CREATE POLICY "Users can delete own verification"
  ON resolution_verifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resolution_verifications_issue_id ON resolution_verifications(issue_id);

-- ============================================
-- TRIGGERS: Maintain denormalized counts
-- ============================================

-- Supporter count
CREATE OR REPLACE FUNCTION update_supporter_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE issues SET supporter_count = supporter_count + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE issues SET supporter_count = supporter_count - 1 WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_supporter_count ON issue_supporters;
CREATE TRIGGER trg_supporter_count
  AFTER INSERT OR DELETE ON issue_supporters
  FOR EACH ROW EXECUTE FUNCTION update_supporter_count();

-- Comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE issues SET comment_count = comment_count + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE issues SET comment_count = comment_count - 1 WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_count ON issue_comments;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Solution count
CREATE OR REPLACE FUNCTION update_solution_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE issues SET solution_count = solution_count + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE issues SET solution_count = solution_count - 1 WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_solution_count ON issue_solutions;
CREATE TRIGGER trg_solution_count
  AFTER INSERT OR DELETE ON issue_solutions
  FOR EACH ROW EXECUTE FUNCTION update_solution_count();

-- Solution vote count
CREATE OR REPLACE FUNCTION update_solution_vote_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE issue_solutions SET vote_count = vote_count + 1 WHERE id = NEW.solution_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE issue_solutions SET vote_count = vote_count - 1 WHERE id = OLD.solution_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_solution_vote_count ON solution_votes;
CREATE TRIGGER trg_solution_vote_count
  AFTER INSERT OR DELETE ON solution_votes
  FOR EACH ROW EXECUTE FUNCTION update_solution_vote_count();

-- Follower count
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE issues SET follower_count = follower_count + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE issues SET follower_count = follower_count - 1 WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follower_count ON issue_followers;
CREATE TRIGGER trg_follower_count
  AFTER INSERT OR DELETE ON issue_followers
  FOR EACH ROW EXECUTE FUNCTION update_follower_count();
