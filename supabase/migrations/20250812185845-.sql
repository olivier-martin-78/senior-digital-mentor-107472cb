-- Add subtitle_color to mini_sites to allow custom subtitle text color
ALTER TABLE public.mini_sites
ADD COLUMN IF NOT EXISTS subtitle_color text;