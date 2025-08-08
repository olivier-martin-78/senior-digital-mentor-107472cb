-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.update_mini_sites_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_mini_site_slug(
  p_first_name TEXT,
  p_last_name TEXT,
  p_postal_code TEXT
) 
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      UNACCENT(p_first_name) || '.' || UNACCENT(p_last_name) || '.' || p_postal_code,
      '[^a-zA-Z0-9.]',
      '',
      'g'
    )
  );
END;
$$;