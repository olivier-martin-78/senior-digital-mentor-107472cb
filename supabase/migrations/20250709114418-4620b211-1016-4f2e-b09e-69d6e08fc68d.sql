-- Corriger la politique RLS pour diary_entries pour limiter la visibilité des entrées
-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "Users can view own diary and diary from same group or global op" ON public.diary_entries;

-- Créer une nouvelle politique plus restrictive
CREATE POLICY "Users can view own diary and shared group diary entries"
ON public.diary_entries 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres entrées
  user_id = auth.uid() 
  OR 
  -- L'utilisateur peut voir les entrées partagées globalement
  shared_globally = true 
  OR 
  -- L'utilisateur peut voir les entrées des autres membres du groupe SEULEMENT si elles sont partagées globalement
  -- (ceci évite de voir toutes les entrées privées du créateur du groupe)
  (shared_globally = true AND EXISTS (
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

-- Vérification : Tester l'accès pour l'utilisateur carolinafernandez.ecp@gmail.com
-- Cette requête simule ce qu'elle devrait voir
SELECT 
  de.id,
  de.title,
  de.user_id,
  de.shared_globally,
  (SELECT email FROM profiles WHERE id = de.user_id) as author_email,
  'TEST_POLICY_CORRECTION' as verification
FROM diary_entries de
WHERE 
  -- Simuler la politique pour l'utilisateur carolinafernandez.ecp@gmail.com
  de.user_id = (SELECT id FROM profiles WHERE email = 'carolinafernandez.ecp@gmail.com')
  OR 
  de.shared_globally = true
ORDER BY de.created_at DESC;