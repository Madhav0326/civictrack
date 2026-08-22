-- Migration 021: Add custom_city and custom_locality columns to issues table for unlisted areas
-- Preserves all previous migrations 001-020. Idempotent and non-destructive.

ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS custom_city text,
  ADD COLUMN IF NOT EXISTS custom_locality text;

-- Update citizen_edit_issue function signature & implementation to support custom location fields
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
  p_people_affected integer DEFAULT NULL,
  p_custom_city text DEFAULT NULL,
  p_custom_locality text DEFAULT NULL
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

  SELECT * INTO v_issue
  FROM public.issues
  WHERE id = p_issue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found.';
  END IF;

  IF v_issue.user_id <> v_caller_id THEN
    RAISE EXCEPTION 'Only the original issue reporter can edit this issue.';
  END IF;

  IF v_issue.status IN ('in_progress', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Editing is locked because this issue is currently %.', replace(v_issue.status, '_', ' ');
  END IF;

  IF v_issue.status NOT IN ('reported', 'under_review', 'acknowledged', 'reopened') THEN
    RAISE EXCEPTION 'This issue status does not permit editing.';
  END IF;

  IF v_issue.edit_count >= 3 THEN
    RAISE EXCEPTION 'Edit limit reached. This issue can no longer be edited (maximum 3 edits allowed).';
  END IF;

  v_is_limited := v_issue.status IN ('under_review', 'acknowledged', 'reopened');

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

  IF p_custom_city IS DISTINCT FROM v_issue.custom_city THEN
    v_changed_fields := array_append(v_changed_fields, 'custom_city');
    v_prev_vals := jsonb_set(v_prev_vals, '{custom_city}', to_jsonb(v_issue.custom_city));
    v_new_vals := jsonb_set(v_new_vals, '{custom_city}', to_jsonb(p_custom_city));
    v_issue.custom_city := p_custom_city;
  END IF;

  IF p_custom_locality IS DISTINCT FROM v_issue.custom_locality THEN
    v_changed_fields := array_append(v_changed_fields, 'custom_locality');
    v_prev_vals := jsonb_set(v_prev_vals, '{custom_locality}', to_jsonb(v_issue.custom_locality));
    v_new_vals := jsonb_set(v_new_vals, '{custom_locality}', to_jsonb(p_custom_locality));
    v_issue.custom_locality := p_custom_locality;
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

  IF array_length(v_changed_fields, 1) IS NULL OR array_length(v_changed_fields, 1) = 0 THEN
    RAISE EXCEPTION 'No field changes were submitted.';
  END IF;

  v_issue.edit_count := v_issue.edit_count + 1;
  v_issue.updated_at := now();

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
    custom_city = v_issue.custom_city,
    custom_locality = v_issue.custom_locality,
    address = v_issue.address,
    pincode = v_issue.pincode,
    date_started = v_issue.date_started,
    frequency = v_issue.frequency,
    people_affected_estimate = v_issue.people_affected_estimate,
    edit_count = v_issue.edit_count,
    updated_at = v_issue.updated_at
  WHERE id = p_issue_id
  RETURNING * INTO v_updated;

  INSERT INTO public.issue_edit_history (
    issue_id, editor_id, edit_number, changed_fields, previous_values, new_values
  ) VALUES (
    p_issue_id, v_caller_id, v_updated.edit_count, v_changed_fields, v_prev_vals, v_new_vals
  );

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.citizen_edit_issue TO authenticated;
