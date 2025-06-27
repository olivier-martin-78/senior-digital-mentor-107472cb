
-- Activer RLS sur la table game_franglais
ALTER TABLE public.game_franglais ENABLE ROW LEVEL SECURITY;

-- Créer une politique qui permet à tous les utilisateurs authentifiés de lire les données du jeu
CREATE POLICY "Allow authenticated users to read game words" 
ON public.game_franglais
FOR SELECT 
TO authenticated 
USING (true);
