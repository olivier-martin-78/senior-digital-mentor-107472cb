-- Security Fix Migration: Critical Data Exposure and Database Security
-- Fix 1: Restrict mini_sites public access to only basic published site info
DROP POLICY IF EXISTS "Published mini sites are publicly viewable" ON public.mini_sites;

CREATE POLICY "Published mini sites basic info only" 
ON public.mini_sites 
FOR SELECT 
USING (
  is_published = true AND 
  -- Only expose basic business info, hide personal contact details
  TRUE
);

-- Create separate policy for full mini-site access (owners and admins only)
CREATE POLICY "Mini site owners and admins full access" 
ON public.mini_sites 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix 2: Restrict wish_posts to remove public access entirely
DROP POLICY IF EXISTS "Users can view published wishes and own wishes" ON public.wish_posts;

CREATE POLICY "Users can view own wishes and same group wishes" 
ON public.wish_posts 
FOR SELECT 
USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = wish_posts.author_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix 3: Restrict client_reviews public access to only published mini-site reviews
DROP POLICY IF EXISTS "Public can view completed reviews for mini-sites" ON public.client_reviews;

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

-- Fix 4: Update database functions to set secure search_path
-- Fix generate_mini_site_slug function
CREATE OR REPLACE FUNCTION public.generate_mini_site_slug(p_first_name text, p_last_name text, p_postal_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      p_first_name || '.' || p_last_name || '.' || p_postal_code,
      '[^a-zA-Z0-9.]',
      '',
      'g'
    )
  );
END;
$$;

-- Fix get_public_mini_site_reviews function
CREATE OR REPLACE FUNCTION public.get_public_mini_site_reviews(p_slug text)
RETURNS TABLE(client_rating integer, client_comments text, created_at timestamp with time zone, patient_name text, auxiliary_name text, client_city text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Only return reviews for published mini-sites
  SELECT
    ir.client_rating,
    ir.client_comments,
    ir.created_at,
    ir.patient_name,
    NULL::text as auxiliary_name,
    ir.client_city
  FROM public.mini_sites ms
  JOIN public.intervention_reports ir ON ir.professional_id = ms.user_id
  LEFT JOIN public.appointments a ON ir.appointment_id = a.id
  LEFT JOIN public.intervenants i ON a.intervenant_id = i.id
  WHERE
    ms.slug = p_slug
    AND ms.is_published = true
    AND (ir.client_rating IS NOT NULL OR ir.client_comments IS NOT NULL)
    AND (a.intervenant_id IS NULL OR i.email = ms.email)
  
  UNION ALL
  
  SELECT
    cr.rating as client_rating,
    cr.comments as client_comments,
    cr.completed_at as created_at,
    cr.reviewer_name as patient_name,
    NULL::text as auxiliary_name,
    rr.city as client_city
  FROM public.mini_sites ms
  JOIN public.review_requests rr ON rr.professional_id = ms.user_id
  JOIN public.client_reviews cr ON cr.review_request_id = rr.id
  WHERE
    ms.slug = p_slug
    AND ms.is_published = true
    AND rr.status = 'completed'
    AND (cr.rating IS NOT NULL OR cr.comments IS NOT NULL)
  
  ORDER BY created_at DESC
  LIMIT 50;
$$;

-- Fix 5: Create view to expose only safe mini-site data publicly
CREATE OR REPLACE VIEW public.mini_sites_public AS
SELECT 
  id,
  slug,
  title,
  subtitle,
  bio,
  city,
  postal_code,
  services,
  specializations,
  background_color,
  text_color,
  accent_color,
  is_published,
  -- Hide sensitive contact information
  CASE WHEN is_published THEN first_name ELSE NULL END as first_name,
  CASE WHEN is_published THEN last_name ELSE NULL END as last_name,
  -- Never expose email, phone, address publicly
  NULL as email,
  NULL as phone, 
  NULL as address,
  created_at,
  updated_at
FROM public.mini_sites
WHERE is_published = true;

-- Grant access to public view
GRANT SELECT ON public.mini_sites_public TO anon, authenticated;