-- Add permanent_access column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN permanent_access boolean DEFAULT false;

-- Create function to determine user access status
CREATE OR REPLACE FUNCTION public.get_user_access_status(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_profile record;
  user_subscription record;
  subscription_plan_name text;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile
  FROM public.profiles 
  WHERE id = user_id_param;
  
  IF user_profile IS NULL THEN
    RETURN 'Inconnu';
  END IF;
  
  -- Check for permanent access first
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
  
  -- Check if in free trial
  IF user_profile.free_trial_end IS NOT NULL AND user_profile.free_trial_end > now() THEN
    RETURN 'Période d''essai';
  END IF;
  
  -- Default case
  RETURN 'Accès expiré';
END;
$$;

-- Drop and recreate the get_admin_users_with_auth_data function with new return type
DROP FUNCTION IF EXISTS public.get_admin_users_with_auth_data();

CREATE OR REPLACE FUNCTION public.get_admin_users_with_auth_data()
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, display_name text, role app_role, blog_posts_count bigint, diary_entries_count bigint, wish_posts_count bigint, clients_count bigint, appointments_count bigint, intervention_reports_count bigint, access_status text, permanent_access boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.created_at,
    au.last_sign_in_at,
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
$$;