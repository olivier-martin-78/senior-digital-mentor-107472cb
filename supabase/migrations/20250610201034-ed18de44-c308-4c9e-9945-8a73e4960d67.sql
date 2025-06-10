
-- Mettre à jour la fonction handle_new_user pour gérer le rôle professionnel
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
  
  -- Vérifier si l'utilisateur est un auxiliaire de vie
  IF (NEW.raw_user_meta_data ->> 'is_auxiliary')::boolean = true THEN
    -- Attribuer le rôle professionnel aux auxiliaires de vie
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professionnel');
  ELSE
    -- Rôle par défaut pour les autres utilisateurs
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'editor');
  END IF;
  
  RETURN NEW;
END;
$$;
