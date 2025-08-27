-- Create big noise game sessions table
CREATE TABLE public.big_noise_game_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_sounds integer NOT NULL DEFAULT 20,
  correct_answers integer NOT NULL DEFAULT 0,
  exact_matches integer NOT NULL DEFAULT 0,
  label_matches integer NOT NULL DEFAULT 0,
  consecutive_bonus integer NOT NULL DEFAULT 0,
  max_consecutive integer NOT NULL DEFAULT 0,
  sounds_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  completion_time integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.big_noise_game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for big_noise_game_sessions
CREATE POLICY "Users can create their own sessions" 
ON public.big_noise_game_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own sessions" 
ON public.big_noise_game_sessions 
FOR SELECT 
USING ((user_id = auth.uid()) OR (EXISTS ( 
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'::app_role
)));

-- Create big noise leaderboards table
CREATE TABLE public.big_noise_leaderboards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month_year text NOT NULL,
  best_score integer NOT NULL DEFAULT 0,
  best_total_points integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.big_noise_leaderboards ENABLE ROW LEVEL SECURITY;

-- Create policies for big_noise_leaderboards
CREATE POLICY "Authenticated users can view leaderboards" 
ON public.big_noise_leaderboards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own leaderboard entries" 
ON public.big_noise_leaderboards 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create function to get big noise leaderboard
CREATE OR REPLACE FUNCTION public.get_big_noise_leaderboard()
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
      bnl.user_id,
      bnl.best_score,
      bnl.best_total_points,
      bnl.games_played,
      p.display_name as user_name
    FROM public.big_noise_leaderboards bnl
    JOIN public.profiles p ON bnl.user_id = p.id
    WHERE bnl.month_year = to_char(now(), 'YYYY-MM')
    ORDER BY bnl.best_total_points DESC, bnl.best_score DESC
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