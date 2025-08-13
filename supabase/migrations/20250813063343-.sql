-- Add section title color column to mini_sites
ALTER TABLE public.mini_sites
ADD COLUMN IF NOT EXISTS section_title_color text;