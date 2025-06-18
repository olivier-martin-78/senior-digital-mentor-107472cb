
-- Ajouter des champs pour gérer les périodes d'essai gratuites et les restrictions
ALTER TABLE public.profiles 
ADD COLUMN free_trial_start timestamp with time zone,
ADD COLUMN free_trial_end timestamp with time zone,
ADD COLUMN account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'trial', 'expired', 'restricted'));

-- Créer une fonction pour vérifier si un utilisateur a accès à l'application
CREATE OR REPLACE FUNCTION public.user_has_app_access(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_profile record;
  has_active_sub boolean;
  inviter_has_sub boolean;
BEGIN
  -- Récupérer le profil utilisateur
  SELECT * INTO user_profile
  FROM public.profiles 
  WHERE id = user_id_param;
  
  IF user_profile IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si l'utilisateur a un abonnement actif
  SELECT public.has_active_subscription(user_id_param) INTO has_active_sub;
  
  IF has_active_sub THEN
    RETURN true;
  END IF;
  
  -- Vérifier si l'utilisateur est dans sa période d'essai gratuite
  IF user_profile.free_trial_end IS NOT NULL AND user_profile.free_trial_end > now() THEN
    RETURN true;
  END IF;
  
  -- Vérifier si l'utilisateur est invité par quelqu'un qui a un abonnement actif
  SELECT EXISTS (
    SELECT 1 
    FROM public.group_members gm
    JOIN public.invitation_groups ig ON gm.group_id = ig.id
    WHERE gm.user_id = user_id_param 
      AND gm.role = 'guest'
      AND public.has_active_subscription(ig.created_by)
  ) INTO inviter_has_sub;
  
  RETURN inviter_has_sub;
END;
$$;

-- Fonction pour initialiser la période d'essai gratuite d'un nouvel utilisateur
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
    free_trial_end = now() + interval '48 hours',
    account_status = 'trial'
  WHERE id = user_id_param 
    AND free_trial_start IS NULL;
END;
$$;

-- Fonction pour mettre à jour le statut des comptes en fonction des abonnements
CREATE OR REPLACE FUNCTION public.update_account_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile_record record;
BEGIN
  -- Parcourir tous les profils pour mettre à jour leur statut
  FOR profile_record IN 
    SELECT id FROM public.profiles
  LOOP
    IF public.user_has_app_access(profile_record.id) THEN
      UPDATE public.profiles 
      SET account_status = 'active' 
      WHERE id = profile_record.id AND account_status != 'active';
    ELSE
      UPDATE public.profiles 
      SET account_status = 'restricted' 
      WHERE id = profile_record.id AND account_status != 'restricted';
    END IF;
  END LOOP;
END;
$$;

-- Mettre à jour la fonction handle_new_user pour initialiser la période d'essai
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
    now() + interval '48 hours',
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
