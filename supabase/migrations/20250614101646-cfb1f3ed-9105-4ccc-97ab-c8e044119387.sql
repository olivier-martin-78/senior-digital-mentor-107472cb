
-- Supprimer les anciennes politiques qui ne fonctionnent pas correctement
DROP POLICY IF EXISTS "Professionnels peuvent voir leurs rendez-vous créés" ON public.appointments;
DROP POLICY IF EXISTS "Intervenants peuvent voir leurs rendez-vous assignés" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent modifier leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent mettre à jour leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent supprimer leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;
DROP POLICY IF EXISTS "strict_professional_access" ON public.appointments;
DROP POLICY IF EXISTS "strict_intervenant_access" ON public.appointments;

-- Créer une nouvelle politique SELECT stricte pour les rendez-vous
CREATE POLICY "appointments_strict_access_policy" 
ON public.appointments 
FOR SELECT
USING (
  -- L'utilisateur est le professionnel qui a créé le rendez-vous
  auth.uid() = professional_id 
  OR 
  -- L'utilisateur est l'intervenant assigné (vérification par email strict)
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      WHERE i.id = appointments.intervenant_id 
      AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND i.email IS NOT NULL
      AND (SELECT email FROM auth.users WHERE id = auth.uid()) IS NOT NULL
    )
  )
);

-- Politique pour INSERT (création) - seulement pour les professionnels
CREATE POLICY "appointments_insert_policy" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

-- Politique pour UPDATE (modification) - seulement pour les professionnels créateurs
CREATE POLICY "appointments_update_policy" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- Politique pour DELETE (suppression) - seulement pour les professionnels créateurs
CREATE POLICY "appointments_delete_policy" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);
