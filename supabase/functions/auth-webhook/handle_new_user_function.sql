
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'display_name'
  );
  
  -- Set default role to 'editor' instead of 'reader'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'editor');
  
  RETURN NEW;
END;
$$;
