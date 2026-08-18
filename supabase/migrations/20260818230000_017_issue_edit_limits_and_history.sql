-- Migration 017: Issue Edit Limits, Atomic Edit RPC, and Edit Audit History
-- Preserves all previous migrations 001-016. Idempotent and non-destructive.

-- 1. Add edit_count column to issues table (max 3 edits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'edit_count'
  ) THEN
    ALTER TABLE public.issues 
    ADD COLUMN edit_count integer NOT NULL DEFAULT 0 
    CONSTRAINT chk_issues_edit_count CHECK (edit_count >= 0 AND edit_count <= 3);
  END IF;
END $$;

-- Revoke direct client UPDATE on edit_count to prevent client manipulation
REVOKE UPDATE (edit_count) ON public.issues FROM anon, authenticated;

-- 2. Create issue_edits_history audit table
CREATE TABLE IF NOT EXISTS public.issue_edits_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  editor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  edited_at timestamptz NOT NULL DEFAULT now(),
  status_at_edit varchar(50) NOT NULL,
  changed_fields text[] NOT NULL,
  previous_values jsonb,
  new_values jsonb
);

ALTER TABLE public.issue_edits_history ENABLE ROW LEVEL SECURITY;

-- RLS: Public read for visible issues
DROP POLICY IF EXISTS "Users can view edit history for visible issues" ON public.issue_edits_history;
CREATE POLICY "Users can view edit history for visible issues"
  ON public.issue_edits_history FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues
      WHERE issues.id = issue_edits_history.issue_id
        AND NOT issues.is_hidden
    )
  );

-- Direct client INSERT/UPDATE/DELETE is revoked; writes occur strictly via SECURITY DEFINER RPC
REVOKE INSERT, UPDATE, DELETE ON public.issue_edits_history FROM anon, authenticated;
GRANT SELECT ON public.issue_edits_history TO anon, authenticated;

-- 3. Atomic RPC Function for Citizen Controlled Issue Editing
CREATE OR REPLACE FUNCTION public.citizen_edit_issue(
  p_issue_id uuid,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_category_id integer DEFAULT NULL,
  p_subcategory_id integer DEFAULT NULL,
  p_severity text DEFAULT NULL,
  p_state_id integer DEFAULT NULL,
  p_district_id integer DEFAULT NULL,
  p_city_id integer DEFAULT NULL,
  p_locality_id integer DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_date_started date DEFAULT NULL,
  p_frequency text DEFAULT NULL,
  p_people_affected integer DEFAULT NULL
)
RETURNS public.issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_issue public.issues%ROWTYPE;
  v_is_limited boolean;
  v_changed_fields text[] := '{}';
  v_prev_vals jsonb := '{}'::jsonb;
  v_new_vals jsonb := '{}'::jsonb;
  v_updated public.issues%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to edit issue.';
  END IF;

  -- Atomically fetch issue for update
  SELECT * INTO v_issue
  FROM public.issues
  WHERE id = p_issue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found.';
  END IF;

  -- Ownership verification
  IF v_issue.user_id <> v_caller_id THEN
    RAISE EXCEPTION 'Only the original issue reporter can edit this issue.';
  END IF;

  -- Enforce status policy: in_progress, resolved, closed cannot be edited
  IF v_issue.status IN ('in_progress', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Editing is locked because this issue is currently %.', replace(v_issue.status, '_', ' ');
  END IF;

  IF v_issue.status NOT IN ('reported', 'under_review', 'acknowledged', 'reopened') THEN
    RAISE EXCEPTION 'This issue status does not permit editing.';
  END IF;

  -- Enforce atomic 3-edit limit
  IF v_issue.edit_count >= 3 THEN
    RAISE EXCEPTION 'Edit limit reached. This issue can no longer be edited (maximum 3 edits allowed).';
  END IF;

  -- Determine if limited edit applies (under_review, acknowledged, reopened lock core routing fields)
  v_is_limited := v_issue.status IN ('under_review', 'acknowledged', 'reopened');

  -- Process editable fields & build audit values
  IF p_description IS NOT NULL AND p_description <> v_issue.description THEN
    v_changed_fields := array_append(v_changed_fields, 'description');
    v_prev_vals := jsonb_set(v_prev_vals, '{description}', to_jsonb(v_issue.description));
    v_new_vals := jsonb_set(v_new_vals, '{description}', to_jsonb(p_description));
    v_issue.description := p_description;
  END IF;

  IF p_address IS NOT NULL AND p_address IS DISTINCT FROM v_issue.address THEN
    v_changed_fields := array_append(v_changed_fields, 'address');
    v_prev_vals := jsonb_set(v_prev_vals, '{address}', to_jsonb(v_issue.address));
    v_new_vals := jsonb_set(v_new_vals, '{address}', to_jsonb(p_address));
    v_issue.address := p_address;
  END IF;

  IF p_pincode IS NOT NULL AND p_pincode IS DISTINCT FROM v_issue.pincode THEN
    v_changed_fields := array_append(v_changed_fields, 'pincode');
    v_prev_vals := jsonb_set(v_prev_vals, '{pincode}', to_jsonb(v_issue.pincode));
    v_new_vals := jsonb_set(v_new_vals, '{pincode}', to_jsonb(p_pincode));
    v_issue.pincode := p_pincode;
  END IF;

  IF p_date_started IS NOT NULL AND p_date_started IS DISTINCT FROM v_issue.date_started THEN
    v_changed_fields := array_append(v_changed_fields, 'date_started');
    v_prev_vals := jsonb_set(v_prev_vals, '{date_started}', to_jsonb(v_issue.date_started));
    v_new_vals := jsonb_set(v_new_vals, '{date_started}', to_jsonb(p_date_started));
    v_issue.date_started := p_date_started;
  END IF;

  IF p_frequency IS NOT NULL AND p_frequency IS DISTINCT FROM v_issue.frequency THEN
    v_changed_fields := array_append(v_changed_fields, 'frequency');
    v_prev_vals := jsonb_set(v_prev_vals, '{frequency}', to_jsonb(v_issue.frequency));
    v_new_vals := jsonb_set(v_new_vals, '{frequency}', to_jsonb(p_frequency));
    v_issue.frequency := p_frequency;
  END IF;

  IF p_people_affected IS NOT NULL AND p_people_affected IS DISTINCT FROM v_issue.people_affected_estimate THEN
    v_changed_fields := array_append(v_changed_fields, 'people_affected_estimate');
    v_prev_vals := jsonb_set(v_prev_vals, '{people_affected_estimate}', to_jsonb(v_issue.people_affected_estimate));
    v_new_vals := jsonb_set(v_new_vals, '{people_affected_estimate}', to_jsonb(p_people_affected));
    v_issue.people_affected_estimate := p_people_affected;
  END IF;

  -- FULL EDIT fields (only allowed when status = 'reported')
  IF NOT v_is_limited THEN
    IF p_title IS NOT NULL AND p_title <> v_issue.title THEN
      v_changed_fields := array_append(v_changed_fields, 'title');
      v_prev_vals := jsonb_set(v_prev_vals, '{title}', to_jsonb(v_issue.title));
      v_new_vals := jsonb_set(v_new_vals, '{title}', to_jsonb(p_title));
      v_issue.title := p_title;
    END IF;

    IF p_category_id IS NOT NULL AND p_category_id <> v_issue.category_id THEN
      v_changed_fields := array_append(v_changed_fields, 'category_id');
      v_prev_vals := jsonb_set(v_prev_vals, '{category_id}', to_jsonb(v_issue.category_id));
      v_new_vals := jsonb_set(v_new_vals, '{category_id}', to_jsonb(p_category_id));
      v_issue.category_id := p_category_id;
    END IF;

    IF p_subcategory_id IS DISTINCT FROM v_issue.subcategory_id THEN
      v_changed_fields := array_append(v_changed_fields, 'subcategory_id');
      v_prev_vals := jsonb_set(v_prev_vals, '{subcategory_id}', to_jsonb(v_issue.subcategory_id));
      v_new_vals := jsonb_set(v_new_vals, '{subcategory_id}', to_jsonb(p_subcategory_id));
      v_issue.subcategory_id := p_subcategory_id;
    END IF;

    IF p_severity IS NOT NULL AND p_severity <> v_issue.severity THEN
      v_changed_fields := array_append(v_changed_fields, 'severity');
      v_prev_vals := jsonb_set(v_prev_vals, '{severity}', to_jsonb(v_issue.severity));
      v_new_vals := jsonb_set(v_new_vals, '{severity}', to_jsonb(p_severity));
      v_issue.severity := p_severity;
    END IF;

    IF p_state_id IS NOT NULL AND p_state_id IS DISTINCT FROM v_issue.state_id THEN
      v_changed_fields := array_append(v_changed_fields, 'state_id');
      v_prev_vals := jsonb_set(v_prev_vals, '{state_id}', to_jsonb(v_issue.state_id));
      v_new_vals := jsonb_set(v_new_vals, '{state_id}', to_jsonb(p_state_id));
      v_issue.state_id := p_state_id;
    END IF;

    IF p_district_id IS DISTINCT FROM v_issue.district_id THEN
      v_changed_fields := array_append(v_changed_fields, 'district_id');
      v_prev_vals := jsonb_set(v_prev_vals, '{district_id}', to_jsonb(v_issue.district_id));
      v_new_vals := jsonb_set(v_new_vals, '{district_id}', to_jsonb(p_district_id));
      v_issue.district_id := p_district_id;
    END IF;

    IF p_city_id IS DISTINCT FROM v_issue.city_id THEN
      v_changed_fields := array_append(v_changed_fields, 'city_id');
      v_prev_vals := jsonb_set(v_prev_vals, '{city_id}', to_jsonb(v_issue.city_id));
      v_new_vals := jsonb_set(v_new_vals, '{city_id}', to_jsonb(p_city_id));
      v_issue.city_id := p_city_id;
    END IF;

    IF p_locality_id IS DISTINCT FROM v_issue.locality_id THEN
      v_changed_fields := array_append(v_changed_fields, 'locality_id');
      v_prev_vals := jsonb_set(v_prev_vals, '{locality_id}', to_jsonb(v_issue.locality_id));
      v_new_vals := jsonb_set(v_new_vals, '{locality_id}', to_jsonb(p_locality_id));
      v_issue.locality_id := p_locality_id;
    END IF;
  END IF;

  -- Ensure at least one field changed
  IF array_length(v_changed_fields, 1) IS NULL OR array_length(v_changed_fields, 1) = 0 THEN
    RAISE EXCEPTION 'No field changes were submitted.';
  END IF;

  -- Increment edit_count atomically
  v_issue.edit_count := v_issue.edit_count + 1;
  v_issue.updated_at := now();

  -- Update issues row
  UPDATE public.issues
  SET
    title = v_issue.title,
    description = v_issue.description,
    category_id = v_issue.category_id,
    subcategory_id = v_issue.subcategory_id,
    severity = v_issue.severity,
    state_id = v_issue.state_id,
    district_id = v_issue.district_id,
    city_id = v_issue.city_id,
    locality_id = v_issue.locality_id,
    address = v_issue.address,
    pincode = v_issue.pincode,
    date_started = v_issue.date_started,
    frequency = v_issue.frequency,
    people_affected_estimate = v_issue.people_affected_estimate,
    edit_count = v_issue.edit_count,
    updated_at = v_issue.updated_at
  WHERE id = p_issue_id
  RETURNING * INTO v_updated;

  -- Insert audit history record
  INSERT INTO public.issue_edits_history (
    issue_id,
    editor_id,
    status_at_edit,
    changed_fields,
    previous_values,
    new_values
  ) VALUES (
    p_issue_id,
    v_caller_id,
    v_issue.status,
    v_changed_fields,
    v_prev_vals,
    v_new_vals
  );

  RETURN v_updated;
END;
$$;

-- Grant EXECUTE on RPC function to authenticated users
GRANT EXECUTE ON FUNCTION public.citizen_edit_issue TO authenticated;
