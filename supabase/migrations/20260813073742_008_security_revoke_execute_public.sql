/*
# Security Hardening Part 3: Revoke EXECUTE from PUBLIC on internal functions

1. Overview
   SECURITY DEFINER functions were still executable by anon/authenticated because
   they inherit EXECUTE from the PUBLIC role. This migration revokes EXECUTE from
   PUBLIC and only grants it to the service_role (which is needed for internal operations).

2. Functions Protected
   - generate_issue_public_id: Called by the issue insert trigger, not via API
   - handle_new_user: Called by the auth trigger, not via API
   - record_status_change: Called by the issue update trigger, not via API
*/

REVOKE EXECUTE ON FUNCTION public.generate_issue_public_id(smallint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_status_change() FROM PUBLIC;

-- Grant to service_role only (needed for trigger execution)
GRANT EXECUTE ON FUNCTION public.generate_issue_public_id(smallint) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_status_change() TO service_role;
