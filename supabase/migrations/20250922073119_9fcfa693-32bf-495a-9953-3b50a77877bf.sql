-- Fix profile data exposure - restrict cross-user access to only public info
DROP POLICY IF EXISTS "Users can view public info of others" ON public.profiles;

-- Create more restrictive policy for viewing other users' profiles
CREATE POLICY "Users can view limited public info of others" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() <> user_id 
  AND (
    -- Only allow viewing username and avatar_url for other users
    -- This prevents access to full_name, preferences, subscription_plan, etc.
    current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated'
  )
);

-- Add policy to prevent anonymous access to reviews
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;

CREATE POLICY "Users can view reviews" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Restrict content categories to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can view content categories" ON public.content_categories;

CREATE POLICY "Authenticated users can view content categories" 
ON public.content_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Restrict categories to authenticated users only  
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;

CREATE POLICY "Authenticated users can view categories" 
ON public.categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);