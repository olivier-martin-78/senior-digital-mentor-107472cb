-- Create object assembly game sessions table
CREATE TABLE public.object_assembly_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES public.cognitive_puzzle_scenarios(id),
  level_id UUID NOT NULL REFERENCES public.cognitive_puzzle_levels(id),
  current_errors INTEGER NOT NULL DEFAULT 0,
  completion_status TEXT NOT NULL DEFAULT 'in_progress',
  completion_time INTEGER,
  score INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  adaptations_triggered JSONB DEFAULT '[]'::jsonb,
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create object assembly game assets table
CREATE TABLE public.object_assembly_game_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type TEXT NOT NULL, -- 'object_icon', 'room_background', 'sound_effect', 'animation'
  asset_name TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  alt_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.object_assembly_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_assembly_game_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for game sessions
CREATE POLICY "Users can view their own game sessions"
ON public.object_assembly_game_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions"
ON public.object_assembly_game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions"
ON public.object_assembly_game_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all game sessions"
ON public.object_assembly_game_sessions
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS policies for game assets
CREATE POLICY "Everyone can view active assets"
ON public.object_assembly_game_assets
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all assets"
ON public.object_assembly_game_assets
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_object_assembly_game_sessions_updated_at
BEFORE UPDATE ON public.object_assembly_game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_object_assembly_game_assets_updated_at
BEFORE UPDATE ON public.object_assembly_game_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default scenarios for Object Assembly game
INSERT INTO public.cognitive_puzzle_scenarios (name, description, thumbnail, created_by) VALUES
('Routine Cuisine', 'Organisez les objets dans la cuisine et planifiez les étapes de lavage de vaisselle', '/placeholder.svg', 'b9ce49d4-d992-438f-8e79-6aa82e841dd2'),
('Organisation Chambre', 'Rangez les vêtements et organisez la routine de coucher', '/placeholder.svg', 'b9ce49d4-d992-438f-8e79-6aa82e841dd2'),
('Relaxation Salon', 'Préparez l''espace de détente et planifiez les activités de loisir', '/placeholder.svg', 'b9ce49d4-d992-438f-8e79-6aa82e841dd2'),
('Hygiène Salle de bain', 'Organisez les produits d''hygiène et planifiez la routine matinale', '/placeholder.svg', 'b9ce49d4-d992-438f-8e79-6aa82e841dd2'),
('Entretien Jardin', 'Disposez les outils de jardinage et planifiez l''entretien des plantes', '/placeholder.svg', 'b9ce49d4-d992-438f-8e79-6aa82e841dd2');

-- Get scenario IDs for creating levels
DO $$
DECLARE
    kitchen_scenario_id UUID;
    bedroom_scenario_id UUID;
    living_scenario_id UUID;
    bathroom_scenario_id UUID;
    garden_scenario_id UUID;
    kitchen_level1_id UUID;
    kitchen_level2_id UUID;
    kitchen_level3_id UUID;
    bedroom_level1_id UUID;
    bedroom_level2_id UUID;
    bedroom_level3_id UUID;
    living_level1_id UUID;
    living_level2_id UUID;
    living_level3_id UUID;
    bathroom_level1_id UUID;
    bathroom_level2_id UUID;
    bathroom_level3_id UUID;
    garden_level1_id UUID;
    garden_level2_id UUID;
    garden_level3_id UUID;
BEGIN
    -- Get scenario IDs
    SELECT id INTO kitchen_scenario_id FROM public.cognitive_puzzle_scenarios WHERE name = 'Routine Cuisine' ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO bedroom_scenario_id FROM public.cognitive_puzzle_scenarios WHERE name = 'Organisation Chambre' ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO living_scenario_id FROM public.cognitive_puzzle_scenarios WHERE name = 'Relaxation Salon' ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO bathroom_scenario_id FROM public.cognitive_puzzle_scenarios WHERE name = 'Hygiène Salle de bain' ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO garden_scenario_id FROM public.cognitive_puzzle_scenarios WHERE name = 'Entretien Jardin' ORDER BY created_at DESC LIMIT 1;

    -- Create levels for Kitchen scenario
    INSERT INTO public.cognitive_puzzle_levels (scenario_id, level_number, name, description, enable_timeline, spatial_required, temporal_required, spatial_title, temporal_title, spatial_icon, temporal_icon) VALUES
    (kitchen_scenario_id, 1, 'Placement Spatial', 'Placez les objets aux bons endroits dans la cuisine', false, 4, 0, 'Vue de la cuisine', '', '🏠', ''),
    (kitchen_scenario_id, 2, 'Ajout Temporel', 'Ajoutez l''ordre des actions dans le temps', true, 4, 3, 'Vue de la cuisine', 'Étapes de lavage', '🏠', '⏰'),
    (kitchen_scenario_id, 3, 'Assemblage Complet', 'Combinez placement spatial et ordre temporel', true, 6, 3, 'Vue de la cuisine', 'Routine complète', '🏠', '⏰')
    RETURNING id INTO kitchen_level1_id, kitchen_level2_id, kitchen_level3_id;

    -- Create levels for other scenarios
    INSERT INTO public.cognitive_puzzle_levels (scenario_id, level_number, name, description, enable_timeline, spatial_required, temporal_required, spatial_title, temporal_title, spatial_icon, temporal_icon) VALUES
    (bedroom_scenario_id, 1, 'Placement Spatial', 'Rangez les objets dans la chambre', false, 4, 0, 'Vue de la chambre', '', '🛏️', ''),
    (bedroom_scenario_id, 2, 'Ajout Temporel', 'Organisez la routine de coucher', true, 4, 2, 'Vue de la chambre', 'Routine coucher', '🛏️', '🌙'),
    (bedroom_scenario_id, 3, 'Assemblage Complet', 'Routine complète de rangement', true, 6, 2, 'Vue de la chambre', 'Routine complète', '🛏️', '🌙'),
    
    (living_scenario_id, 1, 'Placement Spatial', 'Préparez l''espace de détente', false, 4, 0, 'Vue du salon', '', '🛋️', ''),
    (living_scenario_id, 2, 'Ajout Temporel', 'Planifiez les activités de loisir', true, 4, 3, 'Vue du salon', 'Activités détente', '🛋️', '📚'),
    (living_scenario_id, 3, 'Assemblage Complet', 'Routine complète de détente', true, 6, 3, 'Vue du salon', 'Routine complète', '🛋️', '📚'),
    
    (bathroom_scenario_id, 1, 'Placement Spatial', 'Organisez les produits d''hygiène', false, 4, 0, 'Vue salle de bain', '', '🚿', ''),
    (bathroom_scenario_id, 2, 'Ajout Temporel', 'Planifiez la routine matinale', true, 4, 3, 'Vue salle de bain', 'Routine hygiène', '🚿', '🧼'),
    (bathroom_scenario_id, 3, 'Assemblage Complet', 'Routine complète d''hygiène', true, 6, 3, 'Vue salle de bain', 'Routine complète', '🚿', '🧼'),
    
    (garden_scenario_id, 1, 'Placement Spatial', 'Disposez les outils de jardinage', false, 4, 0, 'Vue du jardin', '', '🌱', ''),
    (garden_scenario_id, 2, 'Ajout Temporel', 'Planifiez l''entretien des plantes', true, 4, 3, 'Vue du jardin', 'Entretien plantes', '🌱', '🌿'),
    (garden_scenario_id, 3, 'Assemblage Complet', 'Routine complète de jardinage', true, 6, 3, 'Vue du jardin', 'Routine complète', '🌱', '🌿');

    -- Get level IDs (simplified approach - we'll add specific items later via admin interface)
    RAISE NOTICE 'Object Assembly scenarios and levels created successfully';
END $$;