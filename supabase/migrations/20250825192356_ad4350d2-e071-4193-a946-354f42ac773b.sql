-- Corriger la fonction get_dashboard_stats - éliminer l'imbrication de fonctions d'agrégation
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
      'content_title', sub.content_title,
      'content_type', sub.content_type,
      'view_count', sub.view_count
    )
    ORDER BY sub.view_count DESC
  ) INTO top_content
  FROM (
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
  ) sub;

  -- 5. Actions by type
  SELECT jsonb_agg(
    jsonb_build_object(
      'action_type', sub.action_type,
      'count', sub.count
    )
  ) INTO actions_by_type
  FROM (
    SELECT 
      ua.action_type, 
      COUNT(*)::integer as count
    FROM public.user_actions ua
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY ua.action_type
    ORDER BY COUNT(*) DESC
  ) sub;

  -- 6. Daily activity
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', sub.date,
      'count', sub.count
    )
    ORDER BY sub.date
  ) INTO daily_activity
  FROM (
    SELECT 
      DATE(ua.timestamp)::text as date, 
      COUNT(*)::integer as count
    FROM public.user_actions ua
    WHERE (start_date_param IS NULL OR ua.timestamp >= start_date_param)
      AND (end_date_param IS NULL OR ua.timestamp <= end_date_param)
      AND (user_id_param IS NULL OR ua.user_id = user_id_param)
      AND (content_type_param IS NULL OR ua.content_type = content_type_param)
      AND (action_type_param IS NULL OR ua.action_type = action_type_param)
    GROUP BY DATE(ua.timestamp)
    ORDER BY DATE(ua.timestamp)
  ) sub;

  -- 7. Sessions by user - completely rewritten to avoid nesting issues
  RAISE NOTICE 'DEBUG get_dashboard_stats: Computing sessions by user...';
  
  -- Create sessions_by_user with proper aggregation
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', sub.user_id,
      'session_count', sub.session_count,
      'login_count', sub.session_count,
      'display_name', COALESCE(sub.display_name, sub.email, 'Utilisateur inconnu')
    )
    ORDER BY sub.session_count DESC
  ) INTO sessions_by_user
  FROM (
    SELECT 
      combined.user_id,
      COUNT(DISTINCT combined.activity_date)::integer as session_count,
      p.display_name,
      p.email
    FROM (
      -- Union of activity days from both tables
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
      
      SELECT 
        uls.user_id,
        DATE(uls.login_timestamp) as activity_date
      FROM public.user_login_sessions uls
      WHERE (start_date_param IS NULL OR uls.login_timestamp >= start_date_param)
        AND (end_date_param IS NULL OR uls.login_timestamp <= end_date_param)
        AND (user_id_param IS NULL OR uls.user_id = user_id_param)
    ) combined
    LEFT JOIN public.profiles p ON combined.user_id = p.id
    GROUP BY combined.user_id, p.display_name, p.email
    HAVING COUNT(DISTINCT combined.activity_date) > 0
    ORDER BY COUNT(DISTINCT combined.activity_date) DESC
  ) sub;

  -- 8. Users with action counts
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', sub.user_id,
      'action_count', sub.action_count,
      'display_name', COALESCE(sub.display_name, sub.email, 'Utilisateur inconnu')
    )
    ORDER BY sub.action_count DESC
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
  ) sub;

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
  
  -- Log Nancy89 specifically if found in results
  IF sessions_by_user IS NOT NULL THEN
    DECLARE
      nancy_info jsonb;
    BEGIN
      SELECT jsonb_array_elements(sessions_by_user) INTO nancy_info
      WHERE (jsonb_array_elements(sessions_by_user)->>'display_name') = 'Nancy89'
      LIMIT 1;
      
      IF nancy_info IS NOT NULL THEN
        RAISE NOTICE 'DEBUG Nancy89 found: user_id=%, sessions=%, display_name=%', 
          nancy_info->>'user_id', 
          nancy_info->>'session_count', 
          nancy_info->>'display_name';
      ELSE
        RAISE NOTICE 'DEBUG Nancy89 not found in sessions_by_user results';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'DEBUG Error checking Nancy89: %', SQLERRM;
    END;
  END IF;
  
  RETURN result;
END;
$$;