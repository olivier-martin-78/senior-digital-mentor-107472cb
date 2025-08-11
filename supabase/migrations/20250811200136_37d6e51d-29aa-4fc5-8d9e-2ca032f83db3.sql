-- Add a new optional column to control the title text color for each homepage slide
ALTER TABLE public.homepage_slides
ADD COLUMN IF NOT EXISTS title_color TEXT;