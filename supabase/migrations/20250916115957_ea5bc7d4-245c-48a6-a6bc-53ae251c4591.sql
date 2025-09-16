-- Fix security issue: Remove sensitive personal information from mini_sites_public view
-- Professional contact information (email, phone, address) should not be publicly harvestable

-- Drop the existing view that exposes too much personal information
DROP VIEW IF EXISTS public.mini_sites_public;

-- Create a new secure version that excludes sensitive contact information
CREATE VIEW public.mini_sites_public 
WITH (security_invoker = true) AS
SELECT 
    ms.id,
    ms.site_name,
    ms.site_subtitle,
    ms.logo_url,
    ms.first_name,
    ms.last_name,
    ms.profession,
    -- EXCLUDED: email, phone, postal_code (sensitive contact info)
    ms.city, -- Keep city as it's generally public info for service areas
    ms.about_me,
    ms.why_this_profession,
    ms.skills_and_qualities,
    ms.activity_start_date,
    ms.services_description,
    ms.availability_schedule,
    ms.intervention_radius,
    ms.professional_networks,
    ms.color_palette,
    ms.design_style,
    ms.slug,
    ms.created_at,
    ms.section_title_about_me,
    ms.section_title_why_this_profession,
    ms.section_title_skills_and_qualities,
    ms.section_title_services,
    ms.section_title_availability,
    ms.section_title_contact,
    ms.section_title_follow_me,
    ms.section_title_professional_networks,
    ms.title_color,
    ms.header_gradient_from,
    ms.header_gradient_to,
    ms.section_title_color,
    ms.section_text_color,  
    ms.subtitle_color,
    ms.background_color,
    ms.section_title_divider_from,
    ms.section_title_divider_to,
    ms.logo_size
FROM public.mini_sites ms
WHERE ms.is_published = true;

-- Add RLS policy to ensure only published mini-sites are accessible
-- (Even though the view already filters for is_published = true, this adds defense in depth)
ALTER VIEW public.mini_sites_public ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows public read access to the filtered data
CREATE POLICY "Public can view published mini-sites without contact info" 
ON public.mini_sites_public 
FOR SELECT 
USING (true);

-- Create a separate secure function for authenticated contact access
-- This provides controlled access to contact information for legitimate use cases
CREATE OR REPLACE FUNCTION public.get_mini_site_contact_info(site_slug text)
RETURNS TABLE(email text, phone text, postal_code text) 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  -- Only return contact info if user is authenticated and site is published
  SELECT ms.email, ms.phone, ms.postal_code
  FROM mini_sites ms
  WHERE ms.slug = site_slug 
    AND ms.is_published = true
    AND auth.uid() IS NOT NULL; -- Require authentication
$$;

-- Add comments explaining the security measures
COMMENT ON VIEW public.mini_sites_public IS 'Secure public view of mini-sites that excludes sensitive contact information to prevent harvesting by spammers';
COMMENT ON FUNCTION public.get_mini_site_contact_info IS 'Controlled access to contact information - requires authentication';