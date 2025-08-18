-- Create table for cognitive puzzle scenarios
CREATE TABLE public.cognitive_puzzle_scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Create table for levels within scenarios
CREATE TABLE public.cognitive_puzzle_levels (
  id SERIAL PRIMARY KEY,
  level_number INTEGER NOT NULL,
  scenario_id TEXT REFERENCES public.cognitive_puzzle_scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  enable_timeline BOOLEAN NOT NULL DEFAULT false,
  spatial_required INTEGER NOT NULL DEFAULT 0,
  temporal_required INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(scenario_id, level_number)
);

-- Create table for activities
CREATE TABLE public.cognitive_puzzle_activities (
  id TEXT NOT NULL,
  level_id INTEGER REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'activity',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id, level_id)
);

-- Create table for spatial slots
CREATE TABLE public.cognitive_puzzle_spatial_slots (
  id TEXT NOT NULL,
  level_id INTEGER REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id, level_id)
);

-- Create table for time slots
CREATE TABLE public.cognitive_puzzle_time_slots (
  id TEXT NOT NULL,
  level_id INTEGER REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  period TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id, level_id),
  CHECK (period IN ('morning', 'noon', 'afternoon', 'evening'))
);

-- Create table for twist events
CREATE TABLE public.cognitive_puzzle_twist_events (
  id TEXT NOT NULL,
  level_id INTEGER REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  effect_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id, level_id),
  CHECK (event_type IN ('call', 'visitor', 'rain', 'traffic', 'meeting'))
);

-- Create table for adaptation choices
CREATE TABLE public.cognitive_puzzle_adaptation_choices (
  id TEXT PRIMARY KEY,
  twist_event_id TEXT NOT NULL,
  twist_event_level_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  effect_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (twist_event_id, twist_event_level_id) REFERENCES public.cognitive_puzzle_twist_events(id, level_id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE public.cognitive_puzzle_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_spatial_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_twist_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_adaptation_choices ENABLE ROW LEVEL SECURITY;

-- RLS policies for scenarios - authenticated users can read, admins can manage
CREATE POLICY "Everyone can view active scenarios" ON public.cognitive_puzzle_scenarios
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage scenarios" ON public.cognitive_puzzle_scenarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for levels - inherit from scenarios
CREATE POLICY "Everyone can view levels of active scenarios" ON public.cognitive_puzzle_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cognitive_puzzle_scenarios s
      WHERE s.id = scenario_id AND s.active = true
    )
  );

CREATE POLICY "Admins can manage levels" ON public.cognitive_puzzle_levels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for activities
CREATE POLICY "Everyone can view activities" ON public.cognitive_puzzle_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cognitive_puzzle_levels l
      JOIN public.cognitive_puzzle_scenarios s ON l.scenario_id = s.id
      WHERE l.id = level_id AND s.active = true
    )
  );

CREATE POLICY "Admins can manage activities" ON public.cognitive_puzzle_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for spatial slots
CREATE POLICY "Everyone can view spatial slots" ON public.cognitive_puzzle_spatial_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cognitive_puzzle_levels l
      JOIN public.cognitive_puzzle_scenarios s ON l.scenario_id = s.id
      WHERE l.id = level_id AND s.active = true
    )
  );

CREATE POLICY "Admins can manage spatial slots" ON public.cognitive_puzzle_spatial_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for time slots
CREATE POLICY "Everyone can view time slots" ON public.cognitive_puzzle_time_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cognitive_puzzle_levels l
      JOIN public.cognitive_puzzle_scenarios s ON l.scenario_id = s.id
      WHERE l.id = level_id AND s.active = true
    )
  );

CREATE POLICY "Admins can manage time slots" ON public.cognitive_puzzle_time_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for twist events
CREATE POLICY "Everyone can view twist events" ON public.cognitive_puzzle_twist_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cognitive_puzzle_levels l
      JOIN public.cognitive_puzzle_scenarios s ON l.scenario_id = s.id
      WHERE l.id = level_id AND s.active = true
    )
  );

CREATE POLICY "Admins can manage twist events" ON public.cognitive_puzzle_twist_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for adaptation choices
CREATE POLICY "Everyone can view adaptation choices" ON public.cognitive_puzzle_adaptation_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cognitive_puzzle_twist_events te
      JOIN public.cognitive_puzzle_levels l ON te.level_id = l.id
      JOIN public.cognitive_puzzle_scenarios s ON l.scenario_id = s.id
      WHERE te.id = twist_event_id AND te.level_id = twist_event_level_id AND s.active = true
    )
  );

CREATE POLICY "Admins can manage adaptation choices" ON public.cognitive_puzzle_adaptation_choices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_cognitive_puzzle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_cognitive_puzzle_scenarios_updated_at
  BEFORE UPDATE ON public.cognitive_puzzle_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_cognitive_puzzle_updated_at();

CREATE TRIGGER update_cognitive_puzzle_levels_updated_at
  BEFORE UPDATE ON public.cognitive_puzzle_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_cognitive_puzzle_updated_at();

-- Insert the existing data
-- Insert home scenario
INSERT INTO public.cognitive_puzzle_scenarios (id, name, description, thumbnail, created_by) 
VALUES ('home', 'Journée à la Maison', 'Organisez votre journée à domicile avec soin', '🏠', 
  (SELECT id FROM auth.users WHERE email ILIKE '%admin%' LIMIT 1));

-- Insert city scenario  
INSERT INTO public.cognitive_puzzle_scenarios (id, name, description, thumbnail, created_by) 
VALUES ('city', 'Sortie en Ville', 'Planifiez votre sortie en ville avec plaisir', '🏙️',
  (SELECT id FROM auth.users WHERE email ILIKE '%admin%' LIMIT 1));

-- Insert home scenario levels
INSERT INTO public.cognitive_puzzle_levels (level_number, scenario_id, name, description, enable_timeline, spatial_required, temporal_required) VALUES
(1, 'home', 'Débutant - Focus Spatial', 'Placez les activités dans les bons lieux de la maison', false, 4, 0),
(2, 'home', 'Intermédiaire - Ajout Temps', 'Connectez les activités aux lieux ET aux moments appropriés', true, 4, 4),
(3, 'home', 'Avancé - Séquence Complète', 'Construisez une journée parfaite malgré les imprévus', true, 4, 4);

-- Insert city scenario levels
INSERT INTO public.cognitive_puzzle_levels (level_number, scenario_id, name, description, enable_timeline, spatial_required, temporal_required) VALUES
(1, 'city', 'Débutant - Focus Spatial', 'Choisissez les bons lieux pour vos sorties', false, 4, 0),
(2, 'city', 'Intermédiaire - Ajout Temps', 'Organisez votre sortie dans le temps', true, 4, 4),
(3, 'city', 'Avancé - Séquence Complète', 'Maîtrisez une sortie complexe avec adaptations', true, 4, 4);