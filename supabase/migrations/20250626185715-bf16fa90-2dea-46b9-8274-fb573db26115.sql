
-- Vérifier les politiques RLS existantes sur la table game_franglais
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'game_franglais';

-- Voir les politiques existantes
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'game_franglais';

-- Désactiver RLS sur la table game_franglais car c'est une table de données de jeu publiques
ALTER TABLE public.game_franglais DISABLE ROW LEVEL SECURITY;

-- Ou alternativement, si on veut garder RLS, créer une politique qui permet à tous les utilisateurs authentifiés de lire les données
-- CREATE POLICY "Allow authenticated users to read game words" ON public.game_franglais
-- FOR SELECT TO authenticated USING (true);
