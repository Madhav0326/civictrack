-- Migration 018: Fix profiles RLS infinite recursion using SECURITY DEFINER helpers
-- Idempotent, non-destructive, and preserves all previous migrations 001-017.

-- 1. Helper function: is_admin_or_moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN v_role IN ('admin', 'moderator');
END;
$$;

-- 2. Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN v_role = 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_or_moderator TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated;

-- 3. Replace recursive profiles SELECT RLS policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (
    is_private = false
    OR auth.uid() = id
    OR public.is_admin_or_moderator()
  );

-- 4. Replace subqueries in reports, moderation_actions, and audit_logs policies to use helpers
DROP POLICY IF EXISTS "Moderators can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Users and moderators can view reports" ON public.reports;

CREATE POLICY "Moderators can view all reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.is_admin_or_moderator()
  );

DROP POLICY IF EXISTS "Moderators can view moderation actions" ON public.moderation_actions;
CREATE POLICY "Moderators can view moderation actions"
  ON public.moderation_actions FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_moderator()
  );

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
  );
