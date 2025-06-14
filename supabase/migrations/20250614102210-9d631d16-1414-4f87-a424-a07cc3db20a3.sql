
-- Supprimer complètement toutes les anciennes politiques
DROP POLICY IF EXISTS "appointments_strict_access_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;

-- Créer une politique SELECT ultra stricte pour les rendez-vous
CREATE POLICY "appointments_ultra_strict_select_policy" 
ON public.appointments 
FOR SELECT
USING (
  -- CONDITION 1: L'utilisateur est le professionnel qui a créé le rendez-vous
  auth.uid() = professional_id 
  OR 
  -- CONDITION 2: L'utilisateur est l'intervenant assigné avec vérification stricte par email
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      JOIN auth.users au ON i.email = au.email
      WHERE i.id = appointments.intervenant_id 
      AND au.id = auth.uid()
      AND i.email IS NOT NULL
      AND au.email IS NOT NULL
    )
  )
);

-- Politique pour INSERT (création) - seulement pour les professionnels créateurs
CREATE POLICY "appointments_ultra_strict_insert_policy" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

-- Politique pour UPDATE (modification) - seulement pour les professionnels créateurs
CREATE POLICY "appointments_ultra_strict_update_policy" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- Politique pour DELETE (suppression) - seulement pour les professionnels créateurs
CREATE POLICY "appointments_ultra_strict_delete_policy" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);
