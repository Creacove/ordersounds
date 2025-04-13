
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

-- Create user_favorites table if it doesn't exist
DO $$
BEGIN
  IF NOT public.check_table_exists('user_favorites') THEN
    CREATE TABLE public.user_favorites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      beat_id uuid NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, beat_id)
    );
    
    -- Add RLS policies
    ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
    
    -- Allow users to manage their own favorites
    CREATE POLICY "Users can manage their own favorites"
      ON public.user_favorites
      USING (auth.uid() = user_id);
      
    -- Allow producers to see who favorited their beats
    CREATE POLICY "Producers can see who favorited their beats"
      ON public.user_favorites
      FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.beats b
        WHERE b.id = beat_id AND b.producer_id = auth.uid()
      ));
  END IF;
END
$$;
