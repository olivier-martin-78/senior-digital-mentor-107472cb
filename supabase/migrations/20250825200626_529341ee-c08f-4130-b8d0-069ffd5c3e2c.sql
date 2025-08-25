-- Create audio memory game tables

-- Table for storing game sounds
CREATE TABLE public.audio_memory_game_sounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT NOT NULL, -- 'animals', 'onomatopoeia', 'instruments', 'music', 'nature', 'transport'
  type TEXT NOT NULL, -- 'original', 'variant'
  base_sound_id UUID, -- Reference to original sound for variants
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for game sessions
CREATE TABLE public.audio_memory_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  score INTEGER NOT NULL DEFAULT 0,
  phase1_score INTEGER NOT NULL DEFAULT 0,
  phase2_score INTEGER NOT NULL DEFAULT 0,
  phase3_score INTEGER NOT NULL DEFAULT 0,
  phase4_score INTEGER NOT NULL DEFAULT 0,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  phase4_attempts INTEGER NOT NULL DEFAULT 0,
  phase4_completed BOOLEAN NOT NULL DEFAULT false,
  completion_time INTEGER, -- Time for phase 4 in seconds
  sounds_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for monthly leaderboards
CREATE TABLE public.audio_memory_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  best_score INTEGER NOT NULL DEFAULT 0,
  best_total_points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, difficulty, month_year)
);

-- Enable RLS
ALTER TABLE public.audio_memory_game_sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_memory_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_memory_leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sounds
CREATE POLICY "Authenticated users can view sounds" 
ON public.audio_memory_game_sounds 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sounds" 
ON public.audio_memory_game_sounds 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- RLS Policies for sessions
CREATE POLICY "Users can create their own sessions" 
ON public.audio_memory_game_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own sessions" 
ON public.audio_memory_game_sessions 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- RLS Policies for leaderboards
CREATE POLICY "Authenticated users can view leaderboards" 
ON public.audio_memory_leaderboards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own leaderboard entries" 
ON public.audio_memory_leaderboards 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_audio_memory_sounds_category ON public.audio_memory_game_sounds(category);
CREATE INDEX idx_audio_memory_sessions_user_difficulty ON public.audio_memory_game_sessions(user_id, difficulty);
CREATE INDEX idx_audio_memory_leaderboard_difficulty_month ON public.audio_memory_leaderboards(difficulty, month_year);

-- Function to get leaderboard for a specific difficulty
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
STABLE SECURITY DEFINER
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