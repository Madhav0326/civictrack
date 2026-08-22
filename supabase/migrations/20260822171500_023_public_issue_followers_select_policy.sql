-- Migration 023: Allow public SELECT on issue_followers and issue_supporters for non-hidden issues,
-- and run issue count triggers with definer privileges.
-- Preserves all previous migrations 001-022. Idempotent and non-destructive.

DO $$
BEGIN
  -- 1. issue_followers SELECT policy
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

  -- 2. issue_supporters SELECT policy
  DROP POLICY IF EXISTS "Public can view supporters" ON public.issue_supporters;

  CREATE POLICY "Public can view supporters"
    ON public.issue_supporters FOR SELECT
    TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.issues
        WHERE issues.id = issue_supporters.issue_id
          AND NOT issues.is_hidden
      )
    );
END $$;

-- 3. Security Definer privileges for issue count trigger functions
ALTER FUNCTION public.update_supporter_count()
  SECURITY DEFINER;

ALTER FUNCTION public.update_supporter_count()
  SET search_path = public;

ALTER FUNCTION public.update_follower_count()
  SECURITY DEFINER;

ALTER FUNCTION public.update_follower_count()
  SET search_path = public;
