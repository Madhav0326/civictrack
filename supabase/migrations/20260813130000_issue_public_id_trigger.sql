-- Assign public issue IDs inside the database so browser clients never need
-- permission to call the internal ID generator.
CREATE OR REPLACE FUNCTION public.assign_issue_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL OR btrim(NEW.public_id) = '' THEN
    NEW.public_id := public.generate_issue_public_id(NEW.state_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_issue_public_id ON public.issues;
CREATE TRIGGER trg_assign_issue_public_id
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_issue_public_id();

REVOKE EXECUTE ON FUNCTION public.assign_issue_public_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_issue_public_id() TO service_role;

-- Public IDs are generated only by the trigger, never accepted from API clients.
REVOKE INSERT (public_id) ON public.issues FROM anon, authenticated;

-- Reporting is unavailable to accounts that have been suspended or banned.
DROP POLICY IF EXISTS "Users can insert own issues" ON public.issues;
CREATE POLICY "Active users can insert own issues"
  ON public.issues FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND NOT profiles.is_suspended
        AND NOT profiles.is_banned
    )
  );
