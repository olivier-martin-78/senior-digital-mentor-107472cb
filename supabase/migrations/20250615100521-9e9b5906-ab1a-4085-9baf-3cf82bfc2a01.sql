
-- SOLUTION DÉFINITIVE V8 - Politique ultra-simple pour garantir la visibilité
-- Supprimer toutes les politiques V7
DROP POLICY IF EXISTS "appointments_v7_select_creator_or_intervenant" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v7_insert_creator_only" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v7_update_creator_and_intervenant" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v7_delete_creator_only" ON public.appointments;

-- POLITIQUE SELECT V8 - ULTRA SIMPLE : Le créateur voit TOUJOURS ses RDV
CREATE POLICY "appointments_v8_select_simple" 
ON public.appointments 
FOR SELECT 
USING (
  -- RÈGLE SIMPLE : Si tu as créé le RDV, tu le vois TOUJOURS
  professional_id = auth.uid()
  OR
  -- OU si tu es l'intervenant assigné par email
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- POLITIQUE INSERT V8 - Simple
CREATE POLICY "appointments_v8_insert_simple" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- POLITIQUE UPDATE V8 - Simple
CREATE POLICY "appointments_v8_update_simple" 
ON public.appointments 
FOR UPDATE 
USING (
  professional_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- POLITIQUE DELETE V8 - Seulement le créateur
CREATE POLICY "appointments_v8_delete_simple" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());

-- VÉRIFICATION : Tester immédiatement ce que voit l'utilisateur mtresor2008@gmail.com
-- (Cette requête simule ce que verront les politiques)
SELECT 
    id,
    professional_id,
    status,
    start_time,
    'TEST_POLITIQUE_V8' as verification
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef';
