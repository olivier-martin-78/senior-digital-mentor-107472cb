
-- 1. Corriger les politiques RLS pour permettre les opérations CRUD aux utilisateurs autorisés
DROP POLICY IF EXISTS "strict_professional_access" ON public.appointments;
DROP POLICY IF EXISTS "strict_intervenant_access" ON public.appointments;

-- Politique pour SELECT (lecture)
CREATE POLICY "appointments_select_policy" 
ON public.appointments 
FOR SELECT
USING (
  -- L'utilisateur est le professionnel qui a créé le rendez-vous
  auth.uid() = professional_id 
  OR 
  -- L'utilisateur est l'intervenant assigné (vérification par email)
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      WHERE i.id = appointments.intervenant_id 
      AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Politique pour INSERT (création)
CREATE POLICY "appointments_insert_policy" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

-- Politique pour UPDATE (modification)
CREATE POLICY "appointments_update_policy" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- Politique pour DELETE (suppression)
CREATE POLICY "appointments_delete_policy" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);

-- 2. Supprimer la contrainte de durée minimale qui cause des problèmes
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointment_minimum_duration;

-- 3. Gérer la contrainte de clé étrangère pour les rendez-vous récurrents
-- Modifier la contrainte pour permettre la suppression en cascade
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_parent_appointment_id_fkey;
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_parent_appointment_id_fkey 
FOREIGN KEY (parent_appointment_id) 
REFERENCES public.appointments(id) 
ON DELETE CASCADE;
