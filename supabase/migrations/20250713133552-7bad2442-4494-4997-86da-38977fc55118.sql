-- Créer d'abord le type enum app_role s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'reader', 'professionnel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.get_admin_users_with_auth_data();

-- Recréer la fonction avec le bon type
CREATE OR REPLACE FUNCTION public.get_admin_users_with_auth_data()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  display_name text,
  role public.app_role,
  blog_posts_count bigint,
  diary_entries_count bigint,
  wish_posts_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    COALESCE(wp_count.count, 0) as wish_posts_count
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
  ORDER BY p.created_at DESC;
END;
$$;

-- Accorder les permissions d'exécution aux utilisateurs authentifiés ayant le rôle admin
REVOKE EXECUTE ON FUNCTION public.get_admin_users_with_auth_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_users_with_auth_data() TO authenticated;