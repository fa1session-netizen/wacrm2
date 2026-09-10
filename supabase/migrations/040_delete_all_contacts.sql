-- ============================================================
-- 040_delete_all_contacts.sql
--
-- RPC for securely deleting all contacts belonging to an account.
-- Authorization: Enforces is_account_member(p_account_id, 'agent').
-- Returns: Count of contacts deleted.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_all_account_contacts(p_account_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  -- Verify the caller is an active member of this account with at least 'agent' role
  IF NOT public.is_account_member(p_account_id, 'agent') THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a member of account %', p_account_id;
  END IF;

  WITH deleted AS (
    DELETE FROM public.contacts
    WHERE account_id = p_account_id
    RETURNING id
  )
  SELECT count(*) INTO v_deleted FROM deleted;

  RETURN v_deleted;
END;
$$;

ALTER FUNCTION public.delete_all_account_contacts(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.delete_all_account_contacts(UUID) TO authenticated, service_role;
