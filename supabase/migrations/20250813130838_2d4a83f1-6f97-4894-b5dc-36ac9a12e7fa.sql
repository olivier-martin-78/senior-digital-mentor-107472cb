-- Fix the RLS policy to allow actual public access to published mini-sites
DROP POLICY IF EXISTS "Published mini sites limited public access" ON public.mini_sites;

CREATE POLICY "Published mini sites public access" 
ON public.mini_sites 
FOR SELECT 
USING (is_published = true);