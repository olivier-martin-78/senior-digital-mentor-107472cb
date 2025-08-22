-- Create game_settings table for Object Assembly configuration
CREATE TABLE public.game_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_threshold INTEGER NOT NULL DEFAULT 3,
  object_reduction INTEGER NOT NULL DEFAULT 2,
  default_accessibility_mode BOOLEAN NOT NULL DEFAULT false,
  default_voice_enabled BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for game_settings
CREATE POLICY "Admins can manage game settings" 
ON public.game_settings 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view game settings" 
ON public.game_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.game_settings (error_threshold, object_reduction, default_accessibility_mode, default_voice_enabled)
VALUES (3, 2, false, true);

-- Add trigger for updated_at
CREATE TRIGGER update_game_settings_updated_at
BEFORE UPDATE ON public.game_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();