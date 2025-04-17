
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
  EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', 
                p_table_name, p_column_name, p_column_name)
  USING p_id;
END;
$$;
