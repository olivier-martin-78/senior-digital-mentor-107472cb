-- Supprimer l'ancienne fonction et créer la nouvelle version avec les compteurs supplémentaires
DROP FUNCTION IF EXISTS public.get_admin_users_with_auth_data();

CREATE FUNCTION public.get_admin_users_with_auth_data()
 RETURNS TABLE(
   id uuid, 
   email text, 
   created_at timestamp with time zone, 
   last_sign_in_at timestamp with time zone, 
   display_name text, 
   role app_role, 
   blog_posts_count bigint, 
   diary_entries_count bigint, 
   wish_posts_count bigint,
   clients_count bigint,
   appointments_count bigint,
   intervention_reports_count bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.created_at,
    au.last_sign_in_at,
    p.display_name,
    COALESCE(ur.role, 'reader'::public.app_role) as role,
    COALESCE(bp_count.count, 0) as blog_posts_count,
    COALESCE(de_count.count, 0) as diary_entries_count,
    COALESCE(wp_count.count, 0) as wish_posts_count,
    COALESCE(c_count.count, 0) as clients_count,
    COALESCE(a_count.count, 0) as appointments_count,
    COALESCE(ir_count.count, 0) as intervention_reports_count
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN (
    SELECT author_id, COUNT(*) as count 
    FROM public.blog_posts 
    GROUP BY author_id
  ) bp_count ON p.id = bp_count.author_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM public.diary_entries 
    GROUP BY user_id
  ) de_count ON p.id = de_count.user_id
  LEFT JOIN (
    SELECT author_id, COUNT(*) as count 
    FROM public.wish_posts 
    GROUP BY author_id
  ) wp_count ON p.id = wp_count.author_id
  LEFT JOIN (
    SELECT created_by, COUNT(*) as count 
    FROM public.clients 
    GROUP BY created_by
  ) c_count ON p.id = c_count.created_by
  LEFT JOIN (
    SELECT professional_id, COUNT(*) as count 
    FROM public.appointments 
    GROUP BY professional_id
  ) a_count ON p.id = a_count.professional_id
  LEFT JOIN (
    SELECT professional_id, COUNT(*) as count 
    FROM public.intervention_reports 
    GROUP BY professional_id
  ) ir_count ON p.id = ir_count.professional_id
  ORDER BY p.created_at DESC;
END;
$function$;