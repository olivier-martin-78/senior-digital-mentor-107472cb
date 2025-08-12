-- Clean up duplicate and overly broad profiles policies
-- Keep: Authenticated users can view profiles (auth.uid() IS NOT NULL)
-- Keep: Users can insert/update their own profile; Only admins can delete

DROP POLICY IF EXISTS "Allow all authenticated users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_final" ON public.profiles;