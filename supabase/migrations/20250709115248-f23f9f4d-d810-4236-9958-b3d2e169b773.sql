-- Corriger définitivement la politique RLS pour diary_entries
-- Supprimer l'ancienne politique défaillante
DROP POLICY IF EXISTS "Users can view own diary and shared group diary entries" ON public.diary_entries;

-- Créer une politique stricte : accès uniquement aux entrées du même groupe
CREATE POLICY "Users can view own diary and group members diary entries only"
ON public.diary_entries 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres entrées
  user_id = auth.uid() 
  OR 
  -- L'utilisateur peut voir les entrées des autres membres du même groupe UNIQUEMENT
  -- (suppression du partage global universel qui causait le problème)
  (EXISTS (
    SELECT 1 
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = diary_entries.user_id
  ))
  OR 
  -- Les administrateurs peuvent tout voir
  (EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);