-- Migration 022: Add foreign key relationship between notifications(actor_id) and profiles(id)
-- Preserves all previous migrations 001-021. Idempotent and non-destructive.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_actor_id_profiles_fkey'
      AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_actor_id_profiles_fkey
    FOREIGN KEY (actor_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;
