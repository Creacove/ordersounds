
-- This function lets us mark a user's email as confirmed
-- You'll need to run this SQL in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.admin_update_user_confirmed(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
BEGIN
  -- Update the user in auth.users to mark email as confirmed
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE email = user_email;
END;
$$;
