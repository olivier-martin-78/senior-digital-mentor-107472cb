-- Créer une table pour stocker les dialogues vocaux du puzzle cognitif
CREATE TABLE public.cognitive_puzzle_dialogues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dialogue_key TEXT NOT NULL UNIQUE,
  text_content TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.cognitive_puzzle_dialogues ENABLE ROW LEVEL SECURITY;

-- Créer les politiques
CREATE POLICY "Admins can manage dialogues" 
ON public.cognitive_puzzle_dialogues 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view dialogues" 
ON public.cognitive_puzzle_dialogues 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insérer tous les dialogues existants
INSERT INTO public.cognitive_puzzle_dialogues (dialogue_key, text_content, description, category) VALUES
-- Messages de bienvenue et navigation
('welcome_message', 'Bienvenue dans le jeu de Connexions Spatio-Temporelles', 'Message d''accueil du jeu', 'navigation'),
('scenario_selected', 'Vous avez sélectionné le Scénario : {scenario_name}', 'Message de sélection de scénario', 'navigation'),
('back_to_menu', 'Retour au menu principal', 'Message de retour au menu', 'navigation'),

-- Messages de validation de niveau
('level_success', 'Bravo ! Vous avez réussi ce niveau !', 'Message de succès de niveau', 'validation'),
('level_incomplete_with_timeline', 'Il vous manque encore des activités à placer. Spatial: {spatial_current}/{spatial_required}, Temporel: {temporal_current}/{temporal_required}', 'Message d''échec avec timeline', 'validation'),
('level_incomplete_without_timeline', 'Il vous manque encore des activités à placer. Activités placées: {spatial_current}/{spatial_required}', 'Message d''échec sans timeline', 'validation'),

-- Messages d'interaction avec les activités
('activity_selected', '{activity_name} sélectionné. Cliquez maintenant sur un lieu ou un moment pour le placer.', 'Message de sélection d''activité', 'activity'),
('activity_deselected', '{activity_name} désélectionné', 'Message de désélection d''activité', 'activity'),
('activity_placed_spatial_only', '{activity_name} placé dans {spatial_slot}', 'Message de placement spatial uniquement', 'activity'),
('activity_placed_temporal_only', '{activity_name} placé au {time_slot}', 'Message de placement temporel uniquement', 'activity'),
('activity_placed_both', '{activity_name} placé dans {spatial_slot} au {time_slot}', 'Message de placement spatial et temporel', 'activity'),

-- Messages d'imprévus/défis
('twist_accepted', 'Défi accepté ! Continuez à jouer avec cette adaptation.', 'Message d''acceptation d''imprévu', 'twist'),
('adaptation_choice_confirmed', 'Choix d''adaptation confirmé ! Continuez à jouer.', 'Message de confirmation de choix d''adaptation', 'twist'),
('twist_rejected', 'Défi refusé. Vous continuez le niveau normalement.', 'Message de refus d''imprévu', 'twist'),

-- Messages de statut
('activities_status_with_timeline', 'Spatial: {spatial_count}/{spatial_required}, Temporel: {temporal_count}/{temporal_required}', 'Statut des activités avec timeline', 'status'),
('activities_status_without_timeline', 'Activités placées: {spatial_count}/{spatial_required}', 'Statut des activités sans timeline', 'status');

-- Créer une fonction pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION public.update_cognitive_puzzle_dialogues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER update_cognitive_puzzle_dialogues_updated_at
BEFORE UPDATE ON public.cognitive_puzzle_dialogues
FOR EACH ROW
EXECUTE FUNCTION public.update_cognitive_puzzle_dialogues_updated_at();