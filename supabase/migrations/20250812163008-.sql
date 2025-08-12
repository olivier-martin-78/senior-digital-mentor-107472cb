-- Restrict public read access on intervenants while preserving functionality
-- 1) Ensure RLS is enabled
ALTER TABLE public.intervenants ENABLE ROW LEVEL SECURITY;

-- 2) Remove any overly permissive public SELECT policy
DROP POLICY IF EXISTS "Users can view intervenants" ON public.intervenants;
DROP POLICY IF EXISTS "Allow public to view intervenants" ON public.intervenants;

-- 3) Allow only authenticated users to read intervenants
CREATE POLICY "Authenticated users can view intervenants"
ON public.intervenants
FOR SELECT
TO authenticated
USING (true);

-- Note: We do NOT use FORCE ROW LEVEL SECURITY to allow SECURITY DEFINER functions
-- like public.get_public_mini_site_reviews to perform necessary joins safely.