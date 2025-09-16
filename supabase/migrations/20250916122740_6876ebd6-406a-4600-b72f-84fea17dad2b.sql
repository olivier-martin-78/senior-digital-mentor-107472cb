-- Fix security warnings: Set proper search_path for functions

-- Fix the update trigger function
CREATE OR REPLACE FUNCTION update_fitness_articles_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix the increment views function  
CREATE OR REPLACE FUNCTION public.increment_fitness_article_views(article_id_param UUID, user_id_param UUID DEFAULT NULL, ip_address_param INET DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert view record
  INSERT INTO fitness_article_views (article_id, user_id, ip_address)
  VALUES (article_id_param, user_id_param, ip_address_param);
  
  -- Update view count
  UPDATE fitness_articles 
  SET view_count = view_count + 1 
  WHERE id = article_id_param;
END;
$$;