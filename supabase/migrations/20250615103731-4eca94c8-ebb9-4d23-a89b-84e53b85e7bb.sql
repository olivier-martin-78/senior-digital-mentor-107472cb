
-- Ajouter la colonne updated_by_professional_id pour tracer qui a modifié le rendez-vous
ALTER TABLE public.appointments 
ADD COLUMN updated_by_professional_id UUID;

-- Créer une fonction trigger pour automatiquement remplir updated_by_professional_id lors des mises à jour
CREATE OR REPLACE FUNCTION public.set_updated_by_professional_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Lors d'une mise à jour, enregistrer qui fait la modification
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by_professional_id = auth.uid();
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger qui s'exécute avant chaque UPDATE
CREATE TRIGGER trigger_set_updated_by_professional_id
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by_professional_id();

-- Supprimer les anciennes politiques V9
DROP POLICY IF EXISTS "appointments_v9_select_fixed" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v9_insert_fixed" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v9_update_fixed" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v9_delete_fixed" ON public.appointments;

-- NOUVELLES POLITIQUES V10 - Accès pour le créateur ET le modifieur
CREATE POLICY "appointments_v10_select_creator_and_updater" 
ON public.appointments 
FOR SELECT 
USING (
  -- RÈGLE 1 : Si tu as créé le RDV, tu le vois TOUJOURS
  professional_id = auth.uid()
  OR
  -- RÈGLE 2 : Si tu as modifié le RDV, tu le vois aussi
  updated_by_professional_id = auth.uid()
  OR
  -- RÈGLE 3 : Si tu es l'intervenant assigné
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = public.get_current_user_email()
  )
);

-- POLITIQUE INSERT V10 - Simple
CREATE POLICY "appointments_v10_insert_creator" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- POLITIQUE UPDATE V10 - Créateur ET modifieur peuvent modifier
CREATE POLICY "appointments_v10_update_creator_and_updater" 
ON public.appointments 
FOR UPDATE 
USING (
  professional_id = auth.uid()
  OR
  updated_by_professional_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = public.get_current_user_email()
  )
);

-- POLITIQUE DELETE V10 - Seulement le créateur original
CREATE POLICY "appointments_v10_delete_creator_only" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());

-- VÉRIFICATION : Tester avec les données existantes
SELECT 
    id,
    professional_id,
    updated_by_professional_id,
    status,
    start_time,
    'TEST_POLITIQUE_V10_AVEC_UPDATED_BY' as verification
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef'
   OR updated_by_professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef';
