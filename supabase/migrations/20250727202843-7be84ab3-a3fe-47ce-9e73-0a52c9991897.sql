-- Créer une politique RLS pour permettre aux utilisateurs de voir leurs propres actions
-- (cette politique manquait et causait l'avertissement de sécurité)

CREATE POLICY "users_can_view_own_actions" 
ON public.user_actions 
FOR SELECT 
USING (auth.uid() = user_id);