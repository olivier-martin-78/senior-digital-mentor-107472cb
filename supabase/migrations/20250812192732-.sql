-- Add customizable section title columns to mini_sites
ALTER TABLE public.mini_sites
ADD COLUMN IF NOT EXISTS section_title_about_me text,
ADD COLUMN IF NOT EXISTS section_title_why_this_profession text,
ADD COLUMN IF NOT EXISTS section_title_skills_and_qualities text,
ADD COLUMN IF NOT EXISTS section_title_services text,
ADD COLUMN IF NOT EXISTS section_title_availability text,
ADD COLUMN IF NOT EXISTS section_title_contact text,
ADD COLUMN IF NOT EXISTS section_title_follow_me text,
ADD COLUMN IF NOT EXISTS section_title_professional_networks text;