-- Fix security issues with the leaderboard function
DROP FUNCTION public.get_emotion_leaderboard();

CREATE OR REPLACE FUNCTION public.get_emotion_leaderboard()
RETURNS TABLE(
  user_id UUID,
  best_score INTEGER,
  best_total_points INTEGER,
  games_played INTEGER,
  user_name TEXT,
  rank_position BIGINT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH current_month_data AS (
    SELECT 
      el.user_id,
      el.best_score,
      el.best_total_points,
      el.games_played,
      p.display_name as user_name
    FROM public.emotion_leaderboards el
    JOIN public.profiles p ON el.user_id = p.id
    WHERE el.month_year = to_char(now(), 'YYYY-MM')
    ORDER BY el.best_total_points DESC, el.best_score DESC
  )
  SELECT 
    cmd.user_id,
    cmd.best_score,
    cmd.best_total_points,
    cmd.games_played,
    cmd.user_name,
    ROW_NUMBER() OVER (ORDER BY cmd.best_total_points DESC, cmd.best_score DESC) as rank_position
  FROM current_month_data cmd;
$$;