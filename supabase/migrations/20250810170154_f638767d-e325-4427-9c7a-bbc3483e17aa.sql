-- Fix function search path for security
ALTER FUNCTION public.update_homepage_slides_updated_at() SET search_path = '';