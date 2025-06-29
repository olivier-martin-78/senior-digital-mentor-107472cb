
-- Mettre à jour la fonction init_free_trial pour étendre la période d'essai à 10 jours
CREATE OR REPLACE FUNCTION public.init_free_trial(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    free_trial_start = now(),
    free_trial_end = now() + interval '10 days',
    account_status = 'trial'
  WHERE id = user_id_param 
    AND free_trial_start IS NULL;
END;
$$;

-- Mettre à jour la fonction handle_new_user pour donner 10 jours d'essai aux nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, free_trial_start, free_trial_end, account_status)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'display_name',
    now(),
    now() + interval '10 days',
    'trial'
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
