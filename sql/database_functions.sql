
-- Create function for getting user favorites (compatible with the modified client)
CREATE OR REPLACE FUNCTION public.get_user_favorites(user_id_param UUID)
RETURNS TABLE (beat_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT (jsonb_array_elements_text(favorites)::UUID) AS beat_id
  FROM public.users
  WHERE id = user_id_param AND favorites IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function for adding a beat to favorites
CREATE OR REPLACE FUNCTION public.add_favorite(user_id_param UUID, beat_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET favorites = CASE 
    WHEN favorites IS NULL THEN jsonb_build_array(beat_id_param::text)
    WHEN NOT favorites @> jsonb_build_array(beat_id_param::text) THEN favorites || jsonb_build_array(beat_id_param::text)
    ELSE favorites
  END
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function for removing a beat from favorites
CREATE OR REPLACE FUNCTION public.remove_favorite(user_id_param UUID, beat_id_param UUID)
RETURNS VOID AS $$
DECLARE
  new_favorites JSONB;
BEGIN
  -- First get the current favorites
  SELECT favorites INTO new_favorites FROM public.users WHERE id = user_id_param;
  
  -- Remove the beat_id from favorites
  IF new_favorites IS NOT NULL THEN
    SELECT jsonb_agg(f) INTO new_favorites
    FROM jsonb_array_elements(new_favorites) AS f
    WHERE f <> to_jsonb(beat_id_param::text);
    
    -- Update the user's favorites
    UPDATE public.users SET favorites = COALESCE(new_favorites, '[]'::jsonb) WHERE id = user_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function for creating a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  recipient_id_param UUID,
  sender_id_param UUID,
  type_param TEXT,
  title_param TEXT,
  body_param TEXT,
  entity_id_param UUID,
  entity_type_param TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    notification_type,
    title,
    body,
    is_read,
    related_entity_id,
    related_entity_type
  ) VALUES (
    recipient_id_param,
    sender_id_param,
    type_param,
    title_param,
    body_param,
    false,
    entity_id_param,
    entity_type_param
  );
END;
$$ LANGUAGE plpgsql;
