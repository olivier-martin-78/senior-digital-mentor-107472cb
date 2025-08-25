-- Version ultra-simplifiée de get_dashboard_stats sans imbrication
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  start_date_param timestamp with time zone DEFAULT NULL,
  end_date_param timestamp with time zone DEFAULT NULL,
  user_id_param uuid DEFAULT NULL,
  content_type_param text DEFAULT NULL,
  action_type_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY INVOKER
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
  RAISE NOTICE 'DEBUG get_dashboard_stats: START with params - start_date=%, end_date=%, user_id=%, content_type=%, action_type=%', 
    start_date_param, end_date_param, user_id_param, content_type_param, action_type_param;

  -- Vérification admin simple
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Auth OK, starting calculations';

  -- 1. Total actions - version simple
  SELECT COUNT(*) INTO total_actions
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);
  
  RAISE NOTICE 'DEBUG get_dashboard_stats: total_actions=%', total_actions;

  -- 2. Unique users from actions  
  SELECT COUNT(DISTINCT ua.user_id) INTO unique_users
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);

  RAISE NOTICE 'DEBUG get_dashboard_stats: unique_users=%', unique_users;

  -- 3. Unique users from sessions
  SELECT COUNT(DISTINCT uls.user_id) INTO unique_users_sessions
  FROM public.user_login_sessions uls
  WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
    AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
    AND (user_id_param IS NULL OR uls.user_id = user_id_param);

  RAISE NOTICE 'DEBUG get_dashboard_stats: unique_users_sessions=%', unique_users_sessions;

  -- 4. Top content - version simple
  WITH top_views AS (
    SELECT 
      ua.content_title, 
      ua.content_type, 
      COUNT(*) as view_count
    FROM public.user_actions ua
    WHERE ua.action_type = 'view'
      AND (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    GROUP BY ua.content_title, ua.content_type
    ORDER BY COUNT(*) DESC
    LIMIT 10
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'content_title', tv.content_title,
      'content_type', tv.content_type,
      'view_count', tv.view_count
    )
  ) INTO top_content
  FROM top_views tv;

  -- 5. Actions by type - version simple
  WITH action_counts AS (
    SELECT 
      ua.action_type, 
      COUNT(*) as count
    FROM public.user_actions ua
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY ua.action_type
    ORDER BY COUNT(*) DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'action_type', ac.action_type,
      'count', ac.count
    )
  ) INTO actions_by_type
  FROM action_counts ac;

  -- 6. Daily activity - version simple
  WITH daily_counts AS (
    SELECT 
      DATE(ua.timestamp) as date, 
      COUNT(*) as count
    FROM public.user_actions ua
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY DATE(ua.timestamp)
    ORDER BY DATE(ua.timestamp)
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', dc.date::text,
      'count', dc.count
    )
  ) INTO daily_activity
  FROM daily_counts dc;

  -- 7. Sessions by user - version simplifiée SANS imbrication
  RAISE NOTICE 'DEBUG get_dashboard_stats: Computing sessions by user...';
  
  WITH user_days AS (
    -- Activité depuis user_actions
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
    
    -- Activité depuis user_login_sessions
    SELECT 
      uls.user_id,
      DATE(uls.login_timestamp) as activity_date
    FROM public.user_login_sessions uls
    WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
      AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
      AND (user_id_param IS NULL OR uls.user_id = user_id_param)
  ),
  user_session_counts AS (
    SELECT 
      ud.user_id,
      COUNT(DISTINCT ud.activity_date) as session_count,
      p.display_name,
      p.email
    FROM user_days ud
    LEFT JOIN public.profiles p ON ud.user_id = p.id
    GROUP BY ud.user_id, p.display_name, p.email
    HAVING COUNT(DISTINCT ud.activity_date) > 0
    ORDER BY COUNT(DISTINCT ud.activity_date) DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', usc.user_id,
      'session_count', usc.session_count,
      'login_count', usc.session_count,
      'display_name', COALESCE(usc.display_name, usc.email, 'Utilisateur inconnu')
    )
  ) INTO sessions_by_user
  FROM user_session_counts usc;

  -- 8. Users with action counts - version simple
  WITH user_action_counts AS (
    SELECT 
      ua.user_id,
      COUNT(*) as action_count,
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
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', uac.user_id,
      'action_count', uac.action_count,
      'display_name', COALESCE(uac.display_name, uac.email, 'Utilisateur inconnu')
    )
  ) INTO users_from_actions
  FROM user_action_counts uac;

  -- Build final result
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

  RAISE NOTICE 'DEBUG get_dashboard_stats: SUCCESS - returning result with % total actions', total_actions;
  RETURN result;
END;
$$;