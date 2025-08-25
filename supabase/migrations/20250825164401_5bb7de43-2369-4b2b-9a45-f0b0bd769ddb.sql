-- Create table for visual memory game sessions
CREATE TABLE public.visual_memory_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  score INTEGER NOT NULL DEFAULT 0,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  completion_time INTEGER, -- in seconds for phase 4
  questions_answered INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  phase_4_attempts INTEGER NOT NULL DEFAULT 0,
  phase_4_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on visual_memory_game_sessions
ALTER TABLE public.visual_memory_game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for visual_memory_game_sessions
CREATE POLICY "Users can view their own game sessions" 
ON public.visual_memory_game_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions" 
ON public.visual_memory_game_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions" 
ON public.visual_memory_game_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create leaderboard view (monthly reset)
CREATE TABLE public.visual_memory_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  best_score INTEGER NOT NULL DEFAULT 0,
  best_total_points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, difficulty_level, month_year)
);

-- Enable RLS on visual_memory_leaderboards
ALTER TABLE public.visual_memory_leaderboards ENABLE ROW LEVEL SECURITY;

-- Create policies for visual_memory_leaderboards
CREATE POLICY "Users can view all leaderboards" 
ON public.visual_memory_leaderboards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own leaderboard entries" 
ON public.visual_memory_leaderboards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries" 
ON public.visual_memory_leaderboards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add visual memory game display duration to game_settings
ALTER TABLE public.game_settings 
ADD COLUMN IF NOT EXISTS visual_memory_display_duration INTEGER DEFAULT 10;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_visual_memory_game_sessions_updated_at
BEFORE UPDATE ON public.visual_memory_game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visual_memory_leaderboards_updated_at
BEFORE UPDATE ON public.visual_memory_leaderboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get current month leaderboard
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
SET search_path TO ''
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