
-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$;

-- Function to get user favorites
CREATE OR REPLACE FUNCTION public.get_user_favorites(user_id_param uuid)
RETURNS TABLE (beat_id uuid)
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.check_table_exists('user_favorites') THEN
    -- If the table doesn't exist, return empty result
    RETURN;
  END IF;

  RETURN QUERY
  EXECUTE 'SELECT beat_id FROM public.user_favorites WHERE user_id = $1'
  USING user_id_param;
END;
$$;

-- Function to add a favorite
CREATE OR REPLACE FUNCTION public.add_favorite(user_id_param uuid, beat_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.check_table_exists('user_favorites') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.user_favorites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      beat_id uuid NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, beat_id)
    );
  END IF;

  INSERT INTO public.user_favorites (user_id, beat_id)
  VALUES (user_id_param, beat_id_param)
  ON CONFLICT (user_id, beat_id) DO NOTHING;
END;
$$;

-- Function to remove a favorite
CREATE OR REPLACE FUNCTION public.remove_favorite(user_id_param uuid, beat_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.check_table_exists('user_favorites') THEN
    DELETE FROM public.user_favorites 
    WHERE user_id = user_id_param AND beat_id = beat_id_param;
  END IF;
END;
$$;

-- Function to delete all favorites for a beat (used when deleting a beat)
CREATE OR REPLACE FUNCTION public.delete_beat_favorites(beat_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.check_table_exists('user_favorites') THEN
    DELETE FROM public.user_favorites WHERE beat_id = beat_id_param;
  END IF;
END;
$$;
