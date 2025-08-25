-- Fix the function search path issue by ensuring proper security definer setup
CREATE OR REPLACE FUNCTION public.get_visual_memory_leaderboard(p_difficulty_level TEXT)
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
      vml.user_id,
      vml.best_score,
      vml.best_total_points,
      vml.games_played,
      p.display_name as user_name
    FROM public.visual_memory_leaderboards vml
    JOIN public.profiles p ON vml.user_id = p.id
    WHERE vml.difficulty_level = p_difficulty_level
    AND vml.month_year = to_char(now(), 'YYYY-MM')
    ORDER BY vml.best_total_points DESC, vml.best_score DESC
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