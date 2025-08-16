-- Fix generate_mini_site_slug function to not use UNACCENT and add uniqueness
CREATE OR REPLACE FUNCTION public.generate_mini_site_slug(p_first_name text, p_last_name text, p_postal_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Create base slug without UNACCENT since it's not available
  base_slug := LOWER(
    REGEXP_REPLACE(
      p_first_name || '.' || p_last_name || '.' || p_postal_code,
      '[^a-zA-Z0-9.]',
      '',
      'g'
    )
  );
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.mini_sites WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;