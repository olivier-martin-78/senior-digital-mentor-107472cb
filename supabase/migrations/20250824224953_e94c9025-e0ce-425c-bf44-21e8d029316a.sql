-- Créer une fonction pour compter les utilisateurs uniques avec sessions de connexion
CREATE OR REPLACE FUNCTION public.count_unique_users_with_sessions()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COUNT(DISTINCT user_id) FROM public.user_login_sessions;
$function$;