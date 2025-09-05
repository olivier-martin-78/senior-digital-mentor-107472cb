-- Fix Security Definer View issue for mini_sites_public
-- The view is currently owned by postgres superuser which bypasses RLS
-- We need to recreate it without SECURITY DEFINER properties

-- Drop the existing view
DROP VIEW IF EXISTS public.mini_sites_public CASCADE;

-- Recreate the view without SECURITY DEFINER (default is SECURITY INVOKER)
CREATE VIEW public.mini_sites_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  site_name,
  site_subtitle,
  logo_url,
  first_name,
  last_name,
  profession,
  email,
  phone,
  postal_code,
  city,
  about_me,
  why_this_profession,
  skills_and_qualities,
  activity_start_date,
  services_description,
  availability_schedule,
  intervention_radius,
  professional_networks,
  color_palette,
  design_style,
  slug,
  created_at,
  section_title_about_me,
  section_title_why_this_profession,
  section_title_skills_and_qualities,
  section_title_services,
  section_title_availability,
  section_title_contact,
  section_title_follow_me,
  section_title_professional_networks,
  title_color,
  header_gradient_from,
  header_gradient_to,
  section_title_color,
  section_text_color,
  subtitle_color,
  background_color,
  section_title_divider_from,
  section_title_divider_to,
  logo_size
FROM public.mini_sites
WHERE is_published = true;

-- Grant SELECT permission to anonymous and authenticated users
GRANT SELECT ON public.mini_sites_public TO anon, authenticated;

-- Add a comment explaining the security fix
COMMENT ON VIEW public.mini_sites_public IS 'Public view for published mini-sites. Uses SECURITY INVOKER to respect RLS policies of the querying user.';