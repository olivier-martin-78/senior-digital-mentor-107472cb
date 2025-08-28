-- Create table for emotion images
CREATE TABLE public.emotion_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  emotion_name TEXT NOT NULL,
  intensity TEXT NOT NULL CHECK (intensity IN ('Puissante', 'Intermédiaire', 'Modérée')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.emotion_images ENABLE ROW LEVEL SECURITY;

-- Create policies for emotion_images
CREATE POLICY "Admins can manage emotion images" 
ON public.emotion_images 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view emotion images" 
ON public.emotion_images 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create table for emotion game sessions
CREATE TABLE public.emotion_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  emotion_correct INTEGER NOT NULL DEFAULT 0,
  intensity_correct INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 24,
  completion_time INTEGER,
  session_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emotion_game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for emotion_game_sessions
CREATE POLICY "Users can create their own sessions" 
ON public.emotion_game_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own sessions" 
ON public.emotion_game_sessions 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create table for emotion leaderboards
CREATE TABLE public.emotion_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  best_total_points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE public.emotion_leaderboards ENABLE ROW LEVEL SECURITY;

-- Create policies for emotion_leaderboards
CREATE POLICY "Authenticated users can view leaderboards" 
ON public.emotion_leaderboards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own leaderboard entries" 
ON public.emotion_leaderboards 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create function to get emotion leaderboard
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

-- Create trigger for updating timestamps
CREATE TRIGGER update_emotion_images_updated_at
BEFORE UPDATE ON public.emotion_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emotion_leaderboards_updated_at
BEFORE UPDATE ON public.emotion_leaderboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();