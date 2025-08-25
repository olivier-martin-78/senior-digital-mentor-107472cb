-- Corriger les problèmes de sécurité de la fonction get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  start_date_param timestamp with time zone DEFAULT NULL,
  end_date_param timestamp with time zone DEFAULT NULL,
  user_id_param uuid DEFAULT NULL,
  content_type_param text DEFAULT NULL,
  action_type_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- Vérifier que l'utilisateur a les droits admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- 1. Total des actions avec filtres
  SELECT COUNT(*)::integer INTO total_actions
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);

  -- 2. Utilisateurs uniques (basé sur user_actions avec filtres)
  SELECT COUNT(DISTINCT ua.user_id)::integer INTO unique_users
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);

  -- 3. Utilisateurs uniques basé sur les sessions de connexion
  SELECT COUNT(DISTINCT uls.user_id)::integer INTO unique_users_sessions
  FROM public.user_login_sessions uls
  WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
    AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
    AND (user_id_param IS NULL OR uls.user_id = user_id_param);

  -- 4. Contenu le plus populaire (top 10)
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

  -- 5. Actions par type
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

  -- 6. Activité quotidienne
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

  -- 7. Sessions par utilisateur (CALCUL CORRECT: COUNT DISTINCT par jour)
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
    )
    SELECT 
      uad.user_id,
      COUNT(DISTINCT uad.activity_date)::integer as session_count,
      p.display_name,
      p.email
    FROM user_activity_days uad
    LEFT JOIN public.profiles p ON uad.user_id = p.id
    GROUP BY uad.user_id, p.display_name, p.email
    HAVING COUNT(DISTINCT uad.activity_date) > 0
    ORDER BY COUNT(DISTINCT uad.activity_date) DESC
  ) sessions;

  -- 8. Utilisateurs avec nombre d'actions
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

  -- Construire le résultat final
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

  RETURN result;
END;
$$;