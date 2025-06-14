
-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "appointments_final_strict_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_delete_policy" ON public.appointments;

-- Politique SELECT ultra stricte : SOIT créateur SOIT intervenant avec email exact
CREATE POLICY "appointments_definitive_select_policy" 
ON public.appointments 
FOR SELECT
USING (
  -- L'utilisateur est le professionnel créateur du rendez-vous
  auth.uid() = professional_id 
  OR 
  -- OU l'utilisateur est l'intervenant avec correspondance email exacte
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      JOIN auth.users au ON i.email = au.email
      WHERE i.id = appointments.intervenant_id 
      AND au.id = auth.uid()
      AND i.email IS NOT NULL
      AND au.email IS NOT NULL
      AND i.email = au.email
    )
  )
);

-- Politique pour INSERT - seulement pour les créateurs
CREATE POLICY "appointments_definitive_insert_policy" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

-- Politique pour UPDATE - seulement pour les créateurs
CREATE POLICY "appointments_definitive_update_policy" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- Politique pour DELETE - seulement pour les créateurs
CREATE POLICY "appointments_definitive_delete_policy" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);
