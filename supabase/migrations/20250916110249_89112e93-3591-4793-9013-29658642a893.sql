-- Fix security issues with publicly accessible personal information
-- Remove overly permissive public access policies and restrict to appropriate data

-- 1. Fix mini_sites table - Remove public access to raw table
-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Published mini sites public access" ON public.mini_sites;

-- The mini_sites table should only be accessible by:
-- - Users for their own mini-sites
-- - Admins for all mini-sites  
-- - Public access should go through the mini_sites_public view only

-- 2. Fix client_reviews table - Remove unrestricted public access
-- Drop the policy that allows unrestricted public viewing
DROP POLICY IF EXISTS "Public can view completed reviews for mini-sites" ON public.client_reviews;

-- Drop the policy that allows unrestricted public creation
DROP POLICY IF EXISTS "Reviews can be created via public form" ON public.client_reviews;

-- Add more restrictive policies for client_reviews
-- Allow public to view reviews only for published mini-sites (via proper joins)
CREATE POLICY "Public can view reviews for published mini-sites only" 
ON public.client_reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.review_requests rr
    JOIN public.mini_sites ms ON rr.professional_id = ms.user_id
    WHERE rr.id = client_reviews.review_request_id 
    AND rr.status = 'completed'
    AND ms.is_published = true
  )
);

-- Allow public to create reviews only through valid review requests
CREATE POLICY "Public can create reviews via valid review requests only" 
ON public.client_reviews 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.review_requests rr
    WHERE rr.id = client_reviews.review_request_id 
    AND rr.status = 'pending'
    AND rr.expires_at > now()
  )
);

-- 3. Ensure mini_site_social_links access is properly restricted
-- The existing policy is actually good, but let's make it more explicit
DROP POLICY IF EXISTS "Published mini site social links are publicly viewable" ON public.mini_site_social_links;

CREATE POLICY "Public can view social links for published mini-sites only" 
ON public.mini_site_social_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.mini_sites ms
    WHERE ms.id = mini_site_social_links.mini_site_id 
    AND ms.is_published = true
  )
);

-- Add comment explaining the security fix
COMMENT ON TABLE public.mini_sites IS 'Personal information table - public access restricted to mini_sites_public view only for published sites';
COMMENT ON TABLE public.client_reviews IS 'Client reviews - public access restricted to reviews for published mini-sites only';
COMMENT ON TABLE public.mini_site_social_links IS 'Social links - public access restricted to published mini-sites only';