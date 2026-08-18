-- Migration 016: Add missing foreign key relationship between issue_comments and profiles
-- Idempotent and non-destructive constraint definition

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'issue_comments_user_id_profiles_fkey'
      AND table_name = 'issue_comments'
  ) THEN
    ALTER TABLE public.issue_comments
    ADD CONSTRAINT issue_comments_user_id_profiles_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;
