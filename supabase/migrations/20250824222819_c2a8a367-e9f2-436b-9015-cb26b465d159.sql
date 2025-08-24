-- Créer une fonction pour compter les utilisateurs uniques dans user_actions
CREATE OR REPLACE FUNCTION public.count_unique_users()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COUNT(DISTINCT user_id) FROM public.user_actions;
$function$;