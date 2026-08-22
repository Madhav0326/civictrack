-- Migration 019: Fix comment count trigger function permission error using SECURITY DEFINER
-- Preserves all previous migrations 001-018. Idempotent and non-destructive.

CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.issues
    SET comment_count = comment_count + 1
    WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.issues
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Preserve existing trigger binding on issue_comments
DROP TRIGGER IF EXISTS trg_comment_count ON public.issue_comments;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON public.issue_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();
