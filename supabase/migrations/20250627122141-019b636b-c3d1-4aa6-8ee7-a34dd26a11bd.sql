
-- Créer une table pour stocker l'historique des parties de traduction
CREATE TABLE public.translation_game_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  game_mode text NOT NULL CHECK (game_mode IN ('fr-to-en', 'en-to-fr')),
  words_used jsonb, -- Stocker les mots utilisés dans la partie
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS pour sécuriser les données
ALTER TABLE public.translation_game_sessions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres sessions
CREATE POLICY "Users can view their own game sessions" 
  ON public.translation_game_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de créer leurs propres sessions
CREATE POLICY "Users can create their own game sessions" 
  ON public.translation_game_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_translation_game_sessions_user_id_created_at 
  ON public.translation_game_sessions (user_id, created_at DESC);
