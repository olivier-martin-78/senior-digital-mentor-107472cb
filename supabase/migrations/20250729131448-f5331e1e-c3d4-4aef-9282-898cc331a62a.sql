-- Activer l'accès permanent pour les utilisateurs admin et mtresor2008@gmail.com
UPDATE public.profiles 
SET permanent_access = true 
WHERE email IN ('mtresor2008@gmail.com', 'olivier.martin.78000@gmail.com');

-- Améliorer la fonction get_user_access_status pour être plus précise
CREATE OR REPLACE FUNCTION public.get_user_access_status(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_profile record;
  user_subscription record;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile
  FROM public.profiles 
  WHERE id = user_id_param;
  
  IF user_profile IS NULL THEN
    RETURN 'Inconnu';
  END IF;
  
  -- Check for permanent access first (priorité absolue)
  IF user_profile.permanent_access = true THEN
    RETURN 'Accès permanent';
  END IF;
  
  -- Check for active subscription
  SELECT us.*, sp.name as plan_name INTO user_subscription
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.subscription_plan_id = sp.id
  WHERE us.user_id = user_id_param 
    AND us.status IN ('active', 'trialing')
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  LIMIT 1;
  
  -- If has active subscription
  IF user_subscription.id IS NOT NULL THEN
    IF user_subscription.status = 'trialing' THEN
      RETURN 'Abonné en période d''essai';
    ELSIF user_subscription.plan_name = 'Senior' THEN
      RETURN 'Abonné Senior';
    ELSIF user_subscription.plan_name = 'Professionnel' THEN
      RETURN 'Abonné Professionnel';
    ELSE
      RETURN 'Abonné';
    END IF;
  END IF;
  
  -- Check if in free trial (seulement si pas d'abonnement)
  IF user_profile.free_trial_end IS NOT NULL AND user_profile.free_trial_end > now() THEN
    RETURN 'Période d''essai';
  END IF;
  
  -- Default case - accès expiré
  RETURN 'Accès expiré';
END;
$$;