-- Add customization fields for mini-site colors
ALTER TABLE public.mini_sites
  ADD COLUMN IF NOT EXISTS header_gradient_from text,
  ADD COLUMN IF NOT EXISTS header_gradient_to text,
  ADD COLUMN IF NOT EXISTS section_text_color text,
  ADD COLUMN IF NOT EXISTS section_title_divider_from text,
  ADD COLUMN IF NOT EXISTS section_title_divider_to text;