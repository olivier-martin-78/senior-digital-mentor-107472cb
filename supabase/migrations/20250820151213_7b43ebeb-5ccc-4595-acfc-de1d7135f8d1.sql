-- Add minimal sample data for Object Assembly game (using correct period values)
DO $$
DECLARE
    kitchen_scenario_id UUID;
    kitchen_level1_id UUID;
    kitchen_level2_id UUID;
    kitchen_level3_id UUID;
BEGIN
    -- Get Kitchen scenario ID
    SELECT id INTO kitchen_scenario_id FROM public.cognitive_puzzle_scenarios WHERE name = 'Routine Cuisine' AND created_by = 'b9ce49d4-d992-438f-8e79-6aa82e841dd2' ORDER BY created_at DESC LIMIT 1;

    -- Get Kitchen level IDs
    SELECT id INTO kitchen_level1_id FROM public.cognitive_puzzle_levels WHERE scenario_id = kitchen_scenario_id AND level_number = 1 LIMIT 1;
    SELECT id INTO kitchen_level2_id FROM public.cognitive_puzzle_levels WHERE scenario_id = kitchen_scenario_id AND level_number = 2 LIMIT 1;
    SELECT id INTO kitchen_level3_id FROM public.cognitive_puzzle_levels WHERE scenario_id = kitchen_scenario_id AND level_number = 3 LIMIT 1;

    -- Kitchen Level 1: Basic objects and spatial slots
    INSERT INTO public.cognitive_puzzle_activities (level_id, name, icon, category) VALUES
    (kitchen_level1_id, 'Assiettes sales', '🍽️', 'activity'),
    (kitchen_level1_id, 'Éponge', '🧽', 'activity'),
    (kitchen_level1_id, 'Torchon', '🧻', 'activity'),
    (kitchen_level1_id, 'Assiettes propres', '✨🍽️', 'activity');

    INSERT INTO public.cognitive_puzzle_spatial_slots (level_id, label, icon, x_position, y_position) VALUES
    (kitchen_level1_id, 'Évier', '🚰', 0, 0),
    (kitchen_level1_id, 'Plan de travail', '🏠', 1, 0),
    (kitchen_level1_id, 'Placard', '🚪', 2, 0),
    (kitchen_level1_id, 'Égouttoir', '📦', 1, 1);

    -- Kitchen Level 2: Add timeline with correct period values
    INSERT INTO public.cognitive_puzzle_activities (level_id, name, icon, category) VALUES
    (kitchen_level2_id, 'Assiettes sales', '🍽️', 'activity'),
    (kitchen_level2_id, 'Éponge', '🧽', 'activity'),
    (kitchen_level2_id, 'Torchon', '🧻', 'activity'),
    (kitchen_level2_id, 'Assiettes propres', '✨🍽️', 'activity');

    INSERT INTO public.cognitive_puzzle_spatial_slots (level_id, label, icon, x_position, y_position) VALUES
    (kitchen_level2_id, 'Évier', '🚰', 0, 0),
    (kitchen_level2_id, 'Plan de travail', '🏠', 1, 0),
    (kitchen_level2_id, 'Placard', '🚪', 2, 0);

    INSERT INTO public.cognitive_puzzle_time_slots (level_id, label, icon, period) VALUES
    (kitchen_level2_id, 'D''abord laver', '🧽💧', 'morning'),
    (kitchen_level2_id, 'Puis sécher', '🧻✨', 'noon'),
    (kitchen_level2_id, 'Enfin ranger', '🚪📦', 'afternoon');

    -- Add default game assets
    INSERT INTO public.object_assembly_game_assets (asset_type, asset_name, asset_url, alt_text, metadata) VALUES
    ('sound_effect', 'success', '/sounds/success.mp3', 'Son de réussite', '{"volume": 0.7}'),
    ('sound_effect', 'error', '/sounds/error.mp3', 'Son d''erreur', '{"volume": 0.5}'),
    ('sound_effect', 'place', '/sounds/place.mp3', 'Son de placement', '{"volume": 0.6}');

    -- Add Object Assembly specific dialogues
    INSERT INTO public.cognitive_puzzle_dialogues (dialogue_key, text_content, category, description) VALUES
    ('object_assembly_welcome', 'Bienvenue dans le jeu Assemblage d''Objets dans l''Espace et le Temps. Choisissez un scénario pour commencer.', 'object_assembly', 'Message d''accueil du jeu'),
    ('object_assembly_kitchen_start', 'Commençons par organiser la cuisine. Placez les objets aux bons endroits.', 'object_assembly', 'Début scénario cuisine'),
    ('object_assembly_level_complete', 'Excellent ! Vous avez terminé ce niveau avec succès.', 'object_assembly', 'Niveau terminé'),
    ('object_assembly_good_placement', 'Parfait ! Cet objet est bien placé.', 'object_assembly', 'Bon placement'),
    ('object_assembly_wrong_placement', 'Pas tout à fait. Essayez un autre endroit.', 'object_assembly', 'Mauvais placement');

END $$;