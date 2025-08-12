-- Add missing title_color column to mini_sites to match frontend usage
ALTER TABLE public.mini_sites
ADD COLUMN IF NOT EXISTS title_color text;