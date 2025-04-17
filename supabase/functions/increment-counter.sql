
CREATE OR REPLACE FUNCTION public.increment_counter(
  p_table_name text,
  p_column_name text,
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use a more permissive approach since RLS is disabled
  BEGIN
    EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', 
                  p_table_name, p_column_name, p_column_name)
    USING p_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE NOTICE 'Error incrementing counter: %', SQLERRM;
  END;
END;
$$;
