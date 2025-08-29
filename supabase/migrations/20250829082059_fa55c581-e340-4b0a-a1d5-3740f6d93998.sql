-- Créer la table des niveaux pour le jeu "La magie des mots"
CREATE TABLE public.word_magic_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  letters TEXT NOT NULL, -- ex: "T,E,R,R,E"
  grid_layout JSONB NOT NULL DEFAULT '[]'::jsonb, -- structure de la grille croisée
  solutions JSONB NOT NULL DEFAULT '[]'::jsonb, -- liste des mots corrects
  bonus_words JSONB NOT NULL DEFAULT '[]'::jsonb, -- liste des mots bonus
  difficulty TEXT NOT NULL DEFAULT 'facile', -- facile, moyen, difficile
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table de progression pour le jeu "La magie des mots" 
CREATE TABLE public.word_magic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_number INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  words_found INTEGER NOT NULL DEFAULT 0,
  bonus_words_found INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completion_time INTEGER, -- en secondes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, level_number)
);

-- Créer la table des sessions de jeu pour "La magie des mots"
CREATE TABLE public.word_magic_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_number INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  words_found INTEGER NOT NULL DEFAULT 0,
  bonus_words_found INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL DEFAULT 0,
  completion_time INTEGER, -- en secondes
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des classements pour "La magie des mots"
CREATE TABLE public.word_magic_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- format YYYY-MM
  best_score INTEGER NOT NULL DEFAULT 0,
  total_levels_completed INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  best_completion_time INTEGER, -- meilleur temps en secondes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.word_magic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_magic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_magic_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_magic_leaderboards ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour word_magic_levels
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les niveaux"
ON public.word_magic_levels FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Seuls les admins peuvent gérer les niveaux"
ON public.word_magic_levels FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Politiques RLS pour word_magic_progress
CREATE POLICY "Les utilisateurs peuvent voir leur propre progression"
ON public.word_magic_progress FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Les utilisateurs peuvent créer/modifier leur progression"
ON public.word_magic_progress FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour word_magic_game_sessions
CREATE POLICY "Les utilisateurs peuvent voir leurs sessions"
ON public.word_magic_game_sessions FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Les utilisateurs peuvent créer leurs sessions"
ON public.word_magic_game_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour word_magic_leaderboards
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les classements"
ON public.word_magic_leaderboards FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Les utilisateurs peuvent gérer leurs entrées de classement"
ON public.word_magic_leaderboards FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger pour updated_at sur word_magic_levels
CREATE TRIGGER update_word_magic_levels_updated_at
  BEFORE UPDATE ON public.word_magic_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur word_magic_progress
CREATE TRIGGER update_word_magic_progress_updated_at
  BEFORE UPDATE ON public.word_magic_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur word_magic_leaderboards
CREATE TRIGGER update_word_magic_leaderboards_updated_at
  BEFORE UPDATE ON public.word_magic_leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour récupérer le classement du jeu de mots
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
STABLE SECURITY DEFINER
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