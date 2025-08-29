-- Corriger les problèmes de sécurité détectés
-- Recréer la fonction avec les bonnes pratiques de sécurité
DROP FUNCTION IF EXISTS public.get_word_magic_leaderboard();

-- Créer la fonction corrigée sans SECURITY DEFINER et avec un search_path fixe
CREATE OR REPLACE FUNCTION public.get_word_magic_leaderboard()
RETURNS TABLE(
  user_id UUID,
  best_score INTEGER,
  total_levels_completed INTEGER,
  games_played INTEGER,
  best_completion_time INTEGER,
  user_name TEXT,
  rank_position BIGINT
)
LANGUAGE SQL
STABLE
SET search_path TO 'public'
AS $$
  WITH current_month_data AS (
    SELECT 
      wml.user_id,
      wml.best_score,
      wml.total_levels_completed,
      wml.games_played,
      wml.best_completion_time,
      p.display_name as user_name
    FROM public.word_magic_leaderboards wml
    JOIN public.profiles p ON wml.user_id = p.id
    WHERE wml.month_year = to_char(now(), 'YYYY-MM')
    ORDER BY wml.best_score DESC, wml.total_levels_completed DESC, wml.best_completion_time ASC NULLS LAST
  )
  SELECT 
    cmd.user_id,
    cmd.best_score,
    cmd.total_levels_completed,
    cmd.games_played,
    cmd.best_completion_time,
    cmd.user_name,
    ROW_NUMBER() OVER (
      ORDER BY cmd.best_score DESC, cmd.total_levels_completed DESC, cmd.best_completion_time ASC NULLS LAST
    ) as rank_position
  FROM current_month_data cmd;
$$;