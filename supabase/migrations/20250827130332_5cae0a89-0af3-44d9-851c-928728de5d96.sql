-- Update get_dashboard_stats function to show 100 users instead of 20 in sessions
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(start_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone, end_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone, user_id_param uuid DEFAULT NULL::uuid, content_type_param text DEFAULT NULL::text, action_type_param text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
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
  pinsan_debug jsonb;
BEGIN
  RAISE NOTICE 'DEBUG get_dashboard_stats: START with params - start_date=%, end_date=%, user_id=%, content_type=%, action_type=%', 
    start_date_param, end_date_param, user_id_param, content_type_param, action_type_param;

  -- Vérification admin simple
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Auth OK, starting calculations';

  -- 1. Total actions
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

  -- 3. Unique users from sessions (keep for comparison)
  SELECT COUNT(DISTINCT uls.user_id) INTO unique_users_sessions
  FROM public.user_login_sessions uls
  WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
    AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
    AND (user_id_param IS NULL OR uls.user_id = user_id_param);

  RAISE NOTICE 'DEBUG get_dashboard_stats: unique_users_sessions=%', unique_users_sessions;

  -- DEBUG SPECIFIC POUR PINSAN
  WITH pinsan_data AS (
    SELECT 
      p.display_name,
      p.email,
      COUNT(DISTINCT DATE(ua.timestamp)) as days_with_actions,
      COUNT(DISTINCT DATE(uls.login_timestamp)) as days_with_logins,
      COUNT(*) as total_actions,
      MIN(ua.timestamp) as first_action,
      MAX(ua.timestamp) as last_action
    FROM public.profiles p
    LEFT JOIN public.user_actions ua ON p.id = ua.user_id
    LEFT JOIN public.user_login_sessions uls ON p.id = uls.user_id
    WHERE LOWER(p.display_name) LIKE '%pinsan%' 
       OR LOWER(p.email) LIKE '%pinsan%'
    GROUP BY p.id, p.display_name, p.email
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'display_name', pd.display_name,
      'email', pd.email,
      'days_with_actions', pd.days_with_actions,
      'days_with_logins', pd.days_with_logins,
      'total_actions', pd.total_actions,
      'first_action', pd.first_action,
      'last_action', pd.last_action
    )
  ) INTO pinsan_debug
  FROM pinsan_data pd;

  RAISE NOTICE 'DEBUG PINSAN DATA: %', pinsan_debug;

  -- 4. Top content (étendu à 30 items)
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
    LIMIT 30
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'content_title', tv.content_title,
      'content_type', tv.content_type,
      'view_count', tv.view_count
    )
  ) INTO top_content
  FROM top_views tv;

  -- 5. Actions by type
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

  -- 6. Daily activity
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

  -- 7. Sessions par utilisateur - avec email et date dernière session, limité aux 100 derniers avec au moins 1 session
  RAISE NOTICE 'DEBUG get_dashboard_stats: Computing sessions by user (ACTIONS ONLY)...';
  
  WITH user_activity_days AS (
    SELECT 
      ua.user_id,
      COUNT(DISTINCT DATE(ua.timestamp)) as session_count,
      p.display_name,
      p.email,
      MAX(ua.timestamp) as last_session_date
    FROM public.user_actions ua
    LEFT JOIN public.profiles p ON ua.user_id = p.id
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY ua.user_id, p.display_name, p.email
    HAVING COUNT(DISTINCT DATE(ua.timestamp)) >= 1
    ORDER BY COUNT(DISTINCT DATE(ua.timestamp)) DESC
    LIMIT 100
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', uad.user_id,
      'session_count', uad.session_count,
      'login_count', uad.session_count, -- Garder pour compatibilité
      'display_name', COALESCE(uad.display_name, uad.email, 'Utilisateur inconnu'),
      'email', uad.email,
      'last_session_date', uad.last_session_date
    )
  ) INTO sessions_by_user
  FROM user_activity_days uad;

  -- 8. Users with action counts - limité aux 10 derniers avec au moins 1 action
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
    HAVING COUNT(*) >= 1
    ORDER BY COUNT(*) DESC
    LIMIT 10
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
    'usersFromActions', COALESCE(users_from_actions, '[]'::jsonb),
    'debug_pinsan', COALESCE(pinsan_debug, '[]'::jsonb)
  );

  RAISE NOTICE 'DEBUG get_dashboard_stats: SUCCESS - returning result with % total actions', total_actions;
  RETURN result;
END;
$function$;