-- SECURITY FIX: Remove overly permissive profile access policy
-- This policy was allowing any authenticated user to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Ensure we still have proper access policies:
-- 1. Users can view their own profile (already exists)  
-- 2. Users can view basic info of group members (already exists)
-- 3. Allow public access for review requests (already exists, but more restricted)
-- 4. Admins can view all (we should add this if it doesn't exist)

-- Add admin access policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        CREATE POLICY "Admins can view all profiles" 
        ON public.profiles 
        FOR SELECT 
        USING (is_admin());
    END IF;
END $$;