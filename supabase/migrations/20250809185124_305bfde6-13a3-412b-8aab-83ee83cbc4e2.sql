-- Normalize existing dotted slugs to hyphens
UPDATE public.mini_sites
SET slug = replace(slug, '.', '-')
WHERE slug IS NOT NULL AND position('.' in slug) > 0;