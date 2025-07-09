-- Correction de la politique RLS pour permettre la visibilité des entrées de journal partagées globalement
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can view own diary and group members diary entries only" ON public.diary_entries;

-- Créer la nouvelle politique avec le partage global
CREATE POLICY "Users can view own diary and group members diary entries plus globally shared" 
ON public.diary_entries 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres entrées
  user_id = auth.uid()
  OR
  -- L'utilisateur peut voir les entrées des membres de son groupe
  EXISTS (
    SELECT 1
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = diary_entries.user_id
  )
  OR
  -- NOUVEAU: Contenu partagé globalement - visible par tous les utilisateurs authentifiés
  shared_globally = true
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);