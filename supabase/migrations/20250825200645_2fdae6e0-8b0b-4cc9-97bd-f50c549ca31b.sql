-- Fix security issues in the audio memory game function

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_audio_memory_leaderboard(text);

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION public.get_audio_memory_leaderboard(p_difficulty_level text)
RETURNS TABLE(
  user_id uuid,
  best_score integer,
  best_total_points integer,
  games_played integer,
  user_name text,
  rank_position bigint
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH current_month_data AS (
    SELECT 
      aml.user_id,
      aml.best_score,
      aml.best_total_points,
      aml.games_played,
      p.display_name as user_name
    FROM public.audio_memory_leaderboards aml
    JOIN public.profiles p ON aml.user_id = p.id
    WHERE aml.difficulty = p_difficulty_level
    AND aml.month_year = to_char(now(), 'YYYY-MM')
    ORDER BY aml.best_total_points DESC, aml.best_score DESC
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