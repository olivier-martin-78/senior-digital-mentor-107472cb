-- Créer la table user_login_sessions pour tracker les connexions
CREATE TABLE public.user_login_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table
ALTER TABLE public.user_login_sessions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de voir toutes les sessions
CREATE POLICY "Admins can view all login sessions" 
ON public.user_login_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour permettre aux utilisateurs de créer leurs propres sessions
CREATE POLICY "Users can create their own login sessions" 
ON public.user_login_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Créer un index pour optimiser les requêtes par user_id et timestamp
CREATE INDEX idx_user_login_sessions_user_timestamp ON public.user_login_sessions(user_id, login_timestamp DESC);

-- Modifier la fonction get_admin_users_with_auth_data pour utiliser la nouvelle table
CREATE OR REPLACE FUNCTION public.get_admin_users_with_auth_data()
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, display_name text, role app_role, blog_posts_count bigint, diary_entries_count bigint, wish_posts_count bigint, clients_count bigint, appointments_count bigint, intervention_reports_count bigint, access_status text, permanent_access boolean)
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
    -- Utiliser la dernière connexion de notre table user_login_sessions ou fallback sur auth.users
    COALESCE(uls.last_login, au.last_sign_in_at) as last_sign_in_at,
    p.display_name,
    -- Utiliser une sous-requête pour récupérer le premier rôle trouvé (évite les doublons)
    COALESCE(
      (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = p.id ORDER BY 
        CASE ur.role 
          WHEN 'admin' THEN 1 
          WHEN 'professionnel' THEN 2 
          WHEN 'editor' THEN 3 
          WHEN 'reader' THEN 4 
          ELSE 5 
        END 
        LIMIT 1), 
      'reader'::public.app_role
    ) as role,
    COALESCE(bp_count.count, 0) as blog_posts_count,
    COALESCE(de_count.count, 0) as diary_entries_count,
    COALESCE(wp_count.count, 0) as wish_posts_count,
    COALESCE(c_count.count, 0) as clients_count,
    COALESCE(a_count.count, 0) as appointments_count,
    COALESCE(ir_count.count, 0) as intervention_reports_count,
    public.get_user_access_status(p.id) as access_status,
    COALESCE(p.permanent_access, false) as permanent_access
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  -- Récupérer la dernière session de connexion pour chaque utilisateur
  LEFT JOIN (
    SELECT 
      user_id, 
      MAX(login_timestamp) as last_login
    FROM public.user_login_sessions 
    GROUP BY user_id
  ) uls ON p.id = uls.user_id
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