-- Corriger la fonction user_has_app_access pour prioriser permanent_access
CREATE OR REPLACE FUNCTION public.user_has_app_access(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  
  -- PRIORITÉ ABSOLUE : Vérifier l'accès permanent en premier
  IF user_profile.permanent_access = true THEN
    RETURN true;
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
$function$

-- Mettre à jour la fonction get_user_access_status pour également prioriser permanent_access
CREATE OR REPLACE FUNCTION public.get_user_access_status(user_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$