-- Correction finale des politiques RLS pour diary_entries
-- Supprimer la politique trop permissive qui permet à tous les utilisateurs authentifiés de voir toutes les entrées
DROP POLICY IF EXISTS "Authenticated users can access diary entries" ON public.diary_entries;

-- Garder notre politique restrictive pour SELECT (déjà créée dans la migration précédente)
-- Elle permet seulement :
-- 1. Voir ses propres entrées
-- 2. Voir les entrées des membres du même groupe
-- 3. Accès admin

-- Ajouter les politiques manquantes pour les autres opérations
-- Politique pour INSERT - seul le propriétaire peut créer ses entrées
CREATE POLICY "Users can create their own diary entries"
ON public.diary_entries 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Politique pour UPDATE - seul le propriétaire ou admin peut modifier
CREATE POLICY "Users can update their own diary entries"
ON public.diary_entries 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR 
  (EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);

-- Politique pour DELETE - seul le propriétaire ou admin peut supprimer
CREATE POLICY "Users can delete their own diary entries"
ON public.diary_entries 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR 
  (EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);