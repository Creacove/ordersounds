
CREATE OR REPLACE FUNCTION public.increment_purchase_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.beats
  SET purchase_count = COALESCE(purchase_count, 0) + 1
  WHERE id = NEW.beat_id;
  
  RETURN NEW;
END;
$$;

-- Create a trigger to automatically increment purchase count when a beat is purchased
DROP TRIGGER IF EXISTS increment_purchase_count_trigger ON public.user_purchased_beats;
CREATE TRIGGER increment_purchase_count_trigger
AFTER INSERT ON public.user_purchased_beats
FOR EACH ROW
EXECUTE FUNCTION public.increment_purchase_count();
