-- Secure profiles table: restrict public read, allow only authenticated access and proper ownership updates

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop permissive or conflicting policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;

-- SELECT: Only authenticated users can view profiles (needed for joins and uniqueness checks)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Users can only insert their own profile (sign-up flow); admins may also insert
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid() OR public.is_admin());

-- UPDATE: Users can update only their own profile; admins can update any
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- DELETE: Only admins can delete profiles
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());