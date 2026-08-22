-- Migration 023: Allow public SELECT on issue_followers for visible issues
-- Preserves all previous migrations 001-022. Idempotent and non-destructive.

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own follows" ON public.issue_followers;
  DROP POLICY IF EXISTS "Public can view followers" ON public.issue_followers;

  CREATE POLICY "Public can view followers"
    ON public.issue_followers FOR SELECT
    TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.issues
        WHERE issues.id = issue_followers.issue_id
          AND NOT issues.is_hidden
      )
    );
END $$;
