-- Fix security issues by updating the view to not use SECURITY DEFINER
DROP VIEW IF EXISTS public.mini_sites_public;

CREATE VIEW public.mini_sites_public AS
SELECT 
  id,
  site_name,
  site_subtitle,
  logo_url,
  first_name,
  last_name,
  profession,
  email,  -- Include actual email instead of masking it
  phone,  -- Include phone number
  postal_code,
  about_me,
  why_this_profession,
  skills_and_qualities,
  activity_start_date,
  services_description,
  availability_schedule,
  intervention_radius,
  professional_networks,  -- Include professional networks
  color_palette,
  design_style,
  slug,
  created_at,
  -- Section title fields
  section_title_about_me,
  section_title_why_this_profession,
  section_title_skills_and_qualities,
  section_title_services,
  section_title_availability,
  section_title_contact,
  section_title_follow_me,
  section_title_professional_networks,
  -- Style fields for display
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

-- Grant access to the updated view
GRANT SELECT ON public.mini_sites_public TO public;