
-- Fix RLS policies for carts and cart_items to handle both authenticated and guest users properly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can view their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can update their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can delete their own carts" ON public.carts;

DROP POLICY IF EXISTS "Users can create their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

-- Create new comprehensive policies for carts
CREATE POLICY "Enable all operations for carts" 
  ON public.carts 
  FOR ALL 
  USING (
    -- For authenticated users: user_id must match auth.uid() and session_id must be null
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
    -- For guest users: user_id must be null and session_id must be provided
    (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
    -- Allow service role to access all carts
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    -- For authenticated users: user_id must match auth.uid() and session_id must be null
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
    -- For guest users: user_id must be null and session_id must be provided
    (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
    -- Allow service role to create carts for any user
    (auth.role() = 'service_role')
  );

-- Create comprehensive policies for cart_items
CREATE POLICY "Enable all operations for cart items" 
  ON public.cart_items 
  FOR ALL 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE 
        -- For authenticated users
        (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
        -- For guest users  
        (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
        -- Allow service role
        (auth.role() = 'service_role')
    )
  )
  WITH CHECK (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE 
        -- For authenticated users
        (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
        -- For guest users  
        (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
        -- Allow service role
        (auth.role() = 'service_role')
    )
  );
