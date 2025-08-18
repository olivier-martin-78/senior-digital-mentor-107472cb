-- Migration pour créer les tables de puzzle cognitif avec l'admin existant
-- UUID admin : b9ce49d4-d992-438f-8e79-6aa82e841dd2

-- Table des scénarios
CREATE TABLE public.cognitive_puzzle_scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  thumbnail text NOT NULL,
  created_by uuid NOT NULL DEFAULT 'b9ce49d4-d992-438f-8e79-6aa82e841dd2'::uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des niveaux
CREATE TABLE public.cognitive_puzzle_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES public.cognitive_puzzle_scenarios(id) ON DELETE CASCADE,
  level_number integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  enable_timeline boolean NOT NULL DEFAULT false,
  spatial_required integer NOT NULL DEFAULT 0,
  temporal_required integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(scenario_id, level_number)
);

-- Table des activités
CREATE TABLE public.cognitive_puzzle_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid NOT NULL REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('activity', 'twist')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des emplacements spatiaux
CREATE TABLE public.cognitive_puzzle_spatial_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid NOT NULL REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  label text NOT NULL,
  icon text NOT NULL,
  x_position integer NOT NULL,
  y_position integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des créneaux temporels
CREATE TABLE public.cognitive_puzzle_time_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid NOT NULL REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  label text NOT NULL,
  icon text NOT NULL,
  period text NOT NULL CHECK (period IN ('morning', 'noon', 'afternoon', 'evening')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des événements de rebondissement
CREATE TABLE public.cognitive_puzzle_twist_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid NOT NULL REFERENCES public.cognitive_puzzle_levels(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('call', 'visitor', 'rain', 'traffic', 'meeting')),
  description text NOT NULL,
  effect jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des choix d'adaptation
CREATE TABLE public.cognitive_puzzle_adaptation_choices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  twist_event_id uuid NOT NULL REFERENCES public.cognitive_puzzle_twist_events(id) ON DELETE CASCADE,
  description text NOT NULL,
  effect jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.cognitive_puzzle_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_spatial_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_twist_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_puzzle_adaptation_choices ENABLE ROW LEVEL SECURITY;

-- Policies pour cognitive_puzzle_scenarios
CREATE POLICY "Admins can manage scenarios" ON public.cognitive_puzzle_scenarios
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view scenarios" ON public.cognitive_puzzle_scenarios
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies pour cognitive_puzzle_levels
CREATE POLICY "Admins can manage levels" ON public.cognitive_puzzle_levels
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view levels" ON public.cognitive_puzzle_levels
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies pour cognitive_puzzle_activities
CREATE POLICY "Admins can manage activities" ON public.cognitive_puzzle_activities
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view activities" ON public.cognitive_puzzle_activities
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies pour cognitive_puzzle_spatial_slots
CREATE POLICY "Admins can manage spatial slots" ON public.cognitive_puzzle_spatial_slots
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view spatial slots" ON public.cognitive_puzzle_spatial_slots
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies pour cognitive_puzzle_time_slots
CREATE POLICY "Admins can manage time slots" ON public.cognitive_puzzle_time_slots
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view time slots" ON public.cognitive_puzzle_time_slots
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies pour cognitive_puzzle_twist_events
CREATE POLICY "Admins can manage twist events" ON public.cognitive_puzzle_twist_events
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view twist events" ON public.cognitive_puzzle_twist_events
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies pour cognitive_puzzle_adaptation_choices
CREATE POLICY "Admins can manage adaptation choices" ON public.cognitive_puzzle_adaptation_choices
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view adaptation choices" ON public.cognitive_puzzle_adaptation_choices
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cognitive_puzzle_scenarios_updated_at
    BEFORE UPDATE ON public.cognitive_puzzle_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cognitive_puzzle_levels_updated_at
    BEFORE UPDATE ON public.cognitive_puzzle_levels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insertion des données existantes
-- Scénario "Journée type"
INSERT INTO public.cognitive_puzzle_scenarios (id, name, description, thumbnail)
VALUES (
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,
  'Journée type',
  'Organisez une journée complète en plaçant les activités aux bons moments et dans les bons lieux.',
  '/placeholder.svg'
);

-- Niveau 1 du scénario "Journée type"
INSERT INTO public.cognitive_puzzle_levels (id, scenario_id, level_number, name, description, enable_timeline, spatial_required, temporal_required)
VALUES (
  'b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid,
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,
  1,
  'Matin tranquille',
  'Commencez votre journée en organisant vos activités matinales.',
  true,
  2,
  2
);

-- Activités pour le niveau 1
INSERT INTO public.cognitive_puzzle_activities (level_id, name, icon, category) VALUES
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, 'Petit-déjeuner', '🍳', 'activity'),
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, 'Douche', '🚿', 'activity'),
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, 'Lecture journal', '📰', 'activity');

-- Emplacements spatiaux pour le niveau 1
INSERT INTO public.cognitive_puzzle_spatial_slots (level_id, label, icon, x_position, y_position) VALUES
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, 'Cuisine', '🏠', 100, 100),
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, 'Salle de bain', '🛁', 200, 100),
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, 'Salon', '🛋️', 150, 200);

-- Créneaux temporels pour le niveau 1
INSERT INTO public.cognitive_puzzle_time_slots (level_id, label, icon, period) VALUES
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, '7h00 - 9h00', '🌅', 'morning'),
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, '9h00 - 11h00', '☀️', 'morning'),
('b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid, '11h00 - 13h00', '🌤️', 'noon');

-- Événement de rebondissement
INSERT INTO public.cognitive_puzzle_twist_events (id, level_id, event_type, description, effect)
VALUES (
  'c3d4e5f6-g7h8-9012-3456-789012cdef01'::uuid,
  'b2c3d4e5-f6g7-8901-2345-678901bcdef0'::uuid,
  'call',
  'Appel téléphonique inattendu de la famille',
  '{"moveActivity": "Petit-déjeuner", "newTime": "9h00 - 11h00"}'::jsonb
);

-- Choix d'adaptation
INSERT INTO public.cognitive_puzzle_adaptation_choices (twist_event_id, description, effect) VALUES
('c3d4e5f6-g7h8-9012-3456-789012cdef01'::uuid, 'Prendre l''appel et décaler le petit-déjeuner', '{"moveActivity": "Petit-déjeuner", "newTime": "9h00 - 11h00"}'),
('c3d4e5f6-g7h8-9012-3456-789012cdef01'::uuid, 'Rappeler plus tard', '{}');