-- Corriger la fonction get_dashboard_stats avec logs de debugging
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  start_date_param timestamp with time zone DEFAULT NULL,
  end_date_param timestamp with time zone DEFAULT NULL,
  user_id_param uuid DEFAULT NULL,
  content_type_param text DEFAULT NULL,
  action_type_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY INVOKER  -- Changé de DEFINER à INVOKER pour résoudre les problèmes d'auth
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  total_actions integer;
  unique_users integer;
  unique_users_sessions integer;
  top_content jsonb;
  actions_by_type jsonb;
  daily_activity jsonb;
  sessions_by_user jsonb;
  users_from_actions jsonb;
  current_user_id uuid;
  is_user_admin boolean;
BEGIN
  -- LOG 1: Démarrage de la fonction avec paramètres
  RAISE NOTICE 'DEBUG get_dashboard_stats: Démarrage avec params - start_date: %, end_date: %, user_id: %, content_type: %, action_type: %', 
    start_date_param, end_date_param, user_id_param, content_type_param, action_type_param;

  -- LOG 2: Vérifier l'utilisateur actuel
  current_user_id := auth.uid();
  RAISE NOTICE 'DEBUG get_dashboard_stats: Utilisateur authentifié - user_id: %', current_user_id;
  
  -- Vérifier si l'utilisateur est admin
  SELECT public.is_admin() INTO is_user_admin;
  RAISE NOTICE 'DEBUG get_dashboard_stats: Vérification admin - is_admin: %', is_user_admin;

  -- Vérifier que l'utilisateur est authentifié OU permettre l'accès admin
  IF current_user_id IS NULL AND NOT is_user_admin THEN
    RAISE NOTICE 'DEBUG get_dashboard_stats: ERREUR - Utilisateur non authentifié et pas admin';
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- Vérifier que l'utilisateur a les droits admin (mais permettre si admin même sans auth.uid())
  IF NOT is_user_admin THEN
    RAISE NOTICE 'DEBUG get_dashboard_stats: ERREUR - Utilisateur pas admin';
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Autorisations OK, démarrage des calculs';

  -- 1. Total des actions avec filtres
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul total actions...';
  SELECT COUNT(*)::integer INTO total_actions
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);
  
  RAISE NOTICE 'DEBUG get_dashboard_stats: Total actions calculé: %', total_actions;

  -- 2. Utilisateurs uniques (basé sur user_actions avec filtres)
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul utilisateurs uniques...';
  SELECT COUNT(DISTINCT ua.user_id)::integer INTO unique_users
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);

  RAISE NOTICE 'DEBUG get_dashboard_stats: Utilisateurs uniques calculé: %', unique_users;

  -- 3. Utilisateurs uniques basé sur les sessions de connexion
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul utilisateurs sessions...';
  SELECT COUNT(DISTINCT uls.user_id)::integer INTO unique_users_sessions
  FROM public.user_login_sessions uls
  WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
    AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
    AND (user_id_param IS NULL OR uls.user_id = user_id_param);

  RAISE NOTICE 'DEBUG get_dashboard_stats: Utilisateurs sessions calculé: %', unique_users_sessions;

  -- 4. Contenu le plus populaire (top 10)
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul contenu populaire...';
  SELECT jsonb_agg(
    jsonb_build_object(
      'content_title', ua.content_title,
      'content_type', ua.content_type,
      'view_count', COUNT(*)
    )
    ORDER BY COUNT(*) DESC
  ) INTO top_content
  FROM (
    SELECT ua.content_title, ua.content_type, COUNT(*)
    FROM public.user_actions ua
    WHERE ua.action_type = 'view'
      AND (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    GROUP BY ua.content_title, ua.content_type
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) ua;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Contenu populaire calculé: % items', jsonb_array_length(COALESCE(top_content, '[]'::jsonb));

  -- 5. Actions par type
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul actions par type...';
  SELECT jsonb_agg(
    jsonb_build_object(
      'action_type', ua.action_type,
      'count', ua.count
    )
  ) INTO actions_by_type
  FROM (
    SELECT ua.action_type, COUNT(*)::integer as count
    FROM public.user_actions ua
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY ua.action_type
    ORDER BY COUNT(*) DESC
  ) ua;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Actions par type calculé: % items', jsonb_array_length(COALESCE(actions_by_type, '[]'::jsonb));

  -- 6. Activité quotidienne
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul activité quotidienne...';
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', daily.date,
      'count', daily.count
    )
    ORDER BY daily.date
  ) INTO daily_activity
  FROM (
    SELECT DATE(ua.timestamp)::text as date, COUNT(*)::integer as count
    FROM public.user_actions ua
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY DATE(ua.timestamp)
    ORDER BY DATE(ua.timestamp)
  ) daily;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Activité quotidienne calculée: % jours', jsonb_array_length(COALESCE(daily_activity, '[]'::jsonb));

  -- 7. Sessions par utilisateur avec logs spéciaux pour Nancy89
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul sessions par utilisateur...';
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', sessions.user_id,
      'session_count', sessions.session_count,
      'login_count', sessions.session_count,
      'display_name', COALESCE(sessions.display_name, sessions.email, 'Utilisateur inconnu')
    )
    ORDER BY sessions.session_count DESC
  ) INTO sessions_by_user
  FROM (
    -- Combiner les sessions des actions et des connexions
    WITH user_activity_days AS (
      -- Jours d'activité depuis user_actions
      SELECT 
        ua.user_id,
        DATE(ua.timestamp) as activity_date
      FROM public.user_actions ua
      WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
        AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
        AND (user_id_param IS NULL OR ua.user_id = user_id_param)
        AND (content_type_param IS NULL OR ua.content_type = content_type_param)
        AND (action_type_param IS NULL OR ua.action_type = action_type_param)
      
      UNION
      
      -- Jours de connexion depuis user_login_sessions
      SELECT 
        uls.user_id,
        DATE(uls.login_timestamp) as activity_date
      FROM public.user_login_sessions uls
      WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
        AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
        AND (user_id_param IS NULL OR uls.user_id = user_id_param)
    ),
    nancy_debug AS (
      -- Debug spécial pour Nancy89
      SELECT 
        uad.user_id,
        COUNT(DISTINCT uad.activity_date)::integer as session_count,
        p.display_name,
        p.email,
        array_agg(DISTINCT uad.activity_date ORDER BY uad.activity_date) as activity_dates_array
      FROM user_activity_days uad
      LEFT JOIN public.profiles p ON uad.user_id = p.id
      GROUP BY uad.user_id, p.display_name, p.email
      HAVING COUNT(DISTINCT uad.activity_date) > 0
      ORDER BY COUNT(DISTINCT uad.activity_date) DESC
    )
    SELECT 
      nd.user_id,
      nd.session_count,
      nd.display_name,
      nd.email,
      -- Log spécial pour Nancy89
      CASE 
        WHEN nd.display_name = 'Nancy89' THEN
          (RAISE NOTICE 'DEBUG Nancy89: user_id=%, sessions=%, dates=%', nd.user_id, nd.session_count, nd.activity_dates_array) 
        ELSE NULL
      END,
      nd.session_count -- Retourner le count
    FROM nancy_debug nd
  ) sessions;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Sessions calculées: % utilisateurs', jsonb_array_length(COALESCE(sessions_by_user, '[]'::jsonb));

  -- 8. Utilisateurs avec nombre d'actions
  RAISE NOTICE 'DEBUG get_dashboard_stats: Calcul utilisateurs actions...';
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', users.user_id,
      'action_count', users.action_count,
      'display_name', COALESCE(users.display_name, users.email, 'Utilisateur inconnu')
    )
    ORDER BY users.action_count DESC
  ) INTO users_from_actions
  FROM (
    SELECT 
      ua.user_id,
      COUNT(*)::integer as action_count,
      p.display_name,
      p.email
    FROM public.user_actions ua
    LEFT JOIN public.profiles p ON ua.user_id = p.id
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY ua.user_id, p.display_name, p.email
    ORDER BY COUNT(*) DESC
  ) users;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Utilisateurs actions calculé: % utilisateurs', jsonb_array_length(COALESCE(users_from_actions, '[]'::jsonb));

  -- Construire le résultat final
  RAISE NOTICE 'DEBUG get_dashboard_stats: Construction du résultat final...';
  result := jsonb_build_object(
    'totalActions', total_actions,
    'totalActionsGlobal', total_actions,
    'uniqueUsers', unique_users,
    'uniqueUsersFromSessions', unique_users_sessions,
    'topContent', COALESCE(top_content, '[]'::jsonb),
    'actionsByType', COALESCE(actions_by_type, '[]'::jsonb),
    'dailyActivity', COALESCE(daily_activity, '[]'::jsonb),
    'sessionsByUser', COALESCE(sessions_by_user, '[]'::jsonb),
    'usersFromActions', COALESCE(users_from_actions, '[]'::jsonb)
  );

  RAISE NOTICE 'DEBUG get_dashboard_stats: Résultat final construit, taille: % bytes', length(result::text);
  RAISE NOTICE 'DEBUG get_dashboard_stats: SUCCÈS - Retour du résultat';

  RETURN result;
END;
$$;