-- Corriger la fonction get_dashboard_stats avec syntax simplifiée
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
  current_user_id uuid;
  is_user_admin boolean;
BEGIN
  -- Debug logs
  RAISE NOTICE 'DEBUG get_dashboard_stats: START with params - start_date=%, end_date=%, user_id=%, content_type=%, action_type=%', 
    start_date_param, end_date_param, user_id_param, content_type_param, action_type_param;

  current_user_id := auth.uid();
  RAISE NOTICE 'DEBUG get_dashboard_stats: current_user_id=%', current_user_id;
  
  SELECT public.is_admin() INTO is_user_admin;
  RAISE NOTICE 'DEBUG get_dashboard_stats: is_user_admin=%', is_user_admin;

  -- Simplified auth check - only require admin
  IF NOT is_user_admin THEN
    RAISE NOTICE 'DEBUG get_dashboard_stats: ERROR - Admin access required';
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RAISE NOTICE 'DEBUG get_dashboard_stats: Auth OK, starting calculations';

  -- 1. Total actions
  SELECT COUNT(*)::integer INTO total_actions
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);
  
  RAISE NOTICE 'DEBUG get_dashboard_stats: total_actions=%', total_actions;

  -- 2. Unique users from actions
  SELECT COUNT(DISTINCT ua.user_id)::integer INTO unique_users
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);

  RAISE NOTICE 'DEBUG get_dashboard_stats: unique_users=%', unique_users;

  -- 3. Unique users from sessions
  SELECT COUNT(DISTINCT uls.user_id)::integer INTO unique_users_sessions
  FROM public.user_login_sessions uls
  WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
    AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
    AND (user_id_param IS NULL OR uls.user_id = user_id_param);

  RAISE NOTICE 'DEBUG get_dashboard_stats: unique_users_sessions=%', unique_users_sessions;

  -- 4. Top content
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

  -- 5. Actions by type
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

  -- 6. Daily activity
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

  -- 7. Sessions by user - simplified version
  RAISE NOTICE 'DEBUG get_dashboard_stats: Computing sessions by user...';
  
  WITH user_activity_days AS (
    -- Days from user_actions
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
    
    -- Days from login sessions
    SELECT 
      uls.user_id,
      DATE(uls.login_timestamp) as activity_date
    FROM public.user_login_sessions uls
    WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
      AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
      AND (user_id_param IS NULL OR uls.user_id = user_id_param)
  ),
  user_sessions AS (
    SELECT 
      uad.user_id,
      COUNT(DISTINCT uad.activity_date)::integer as session_count,
      p.display_name,
      p.email,
      array_agg(DISTINCT uad.activity_date ORDER BY uad.activity_date) as activity_dates
    FROM user_activity_days uad
    LEFT JOIN public.profiles p ON uad.user_id = p.id
    GROUP BY uad.user_id, p.display_name, p.email
    HAVING COUNT(DISTINCT uad.activity_date) > 0
    ORDER BY COUNT(DISTINCT uad.activity_date) DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', us.user_id,
      'session_count', us.session_count,
      'login_count', us.session_count,
      'display_name', COALESCE(us.display_name, us.email, 'Utilisateur inconnu'),
      'activity_dates', us.activity_dates
    )
    ORDER BY us.session_count DESC
  ) INTO sessions_by_user
  FROM user_sessions us;

  -- Special log for Nancy89
  WITH nancy_check AS (
    SELECT 
      uad.user_id,
      COUNT(DISTINCT uad.activity_date) as nancy_sessions,
      p.display_name,
      array_agg(DISTINCT uad.activity_date ORDER BY uad.activity_date) as nancy_dates
    FROM (
      SELECT ua.user_id, DATE(ua.timestamp) as activity_date
      FROM public.user_actions ua
      WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
        AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      UNION
      SELECT uls.user_id, DATE(uls.login_timestamp) as activity_date
      FROM public.user_login_sessions uls
      WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
        AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
    ) uad
    LEFT JOIN public.profiles p ON uad.user_id = p.id
    WHERE p.display_name = 'Nancy89'
    GROUP BY uad.user_id, p.display_name
  )
  SELECT nancy_sessions, nancy_dates INTO unique_users, daily_activity -- Temporary variables for logging
  FROM nancy_check LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'DEBUG Nancy89: sessions=%, dates=%', unique_users, daily_activity;
  END IF;

  -- 8. Users with action counts
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

  -- Recalculate proper values for final result
  SELECT COUNT(DISTINCT ua.user_id)::integer INTO unique_users
  FROM public.user_actions ua
  WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
    AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
    AND (user_id_param IS NULL OR ua.user_id = user_id_param)
    AND (content_type_param IS NULL OR ua.content_type = content_type_param)
    AND (action_type_param IS NULL OR ua.action_type = action_type_param);

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

  RAISE NOTICE 'DEBUG get_dashboard_stats: SUCCESS - result size=% bytes', length(result::text);
  RETURN result;
END;
$$;