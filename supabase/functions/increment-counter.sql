
CREATE OR REPLACE FUNCTION public.increment(
  row_id uuid,
  table_name text,
  column_name text
) RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  current_value numeric;
  new_value numeric;
BEGIN
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', column_name, table_name)
  INTO current_value
  USING row_id;
  
  -- Set default value of 0 if current value is NULL
  IF current_value IS NULL THEN
    current_value := 0;
  END IF;
  
  -- Increment by 1
  new_value := current_value + 1;
  
  RETURN new_value;
END;
$$;
