
-- CORRECTION V9 - Remplacer l'accès direct à auth.users par la fonction SECURITY DEFINER
-- Supprimer les politiques V8 qui causent "permission denied for table users"
DROP POLICY IF EXISTS "appointments_v8_select_simple" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v8_insert_simple" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v8_update_simple" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v8_delete_simple" ON public.appointments;

-- POLITIQUE SELECT V9 - Utiliser la fonction SECURITY DEFINER au lieu d'accéder directement à auth.users
CREATE POLICY "appointments_v9_select_fixed" 
ON public.appointments 
FOR SELECT 
USING (
  -- RÈGLE 1 : Si tu as créé le RDV, tu le vois TOUJOURS
  professional_id = auth.uid()
  OR
  -- RÈGLE 2 : Si tu es l'intervenant assigné (utiliser la fonction SECURITY DEFINER)
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = public.get_current_user_email()
  )
);

-- POLITIQUE INSERT V9 - Simple
CREATE POLICY "appointments_v9_insert_fixed" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- POLITIQUE UPDATE V9 - Utiliser la fonction SECURITY DEFINER
CREATE POLICY "appointments_v9_update_fixed" 
ON public.appointments 
FOR UPDATE 
USING (
  professional_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = public.get_current_user_email()
  )
);

-- POLITIQUE DELETE V9 - Seulement le créateur
CREATE POLICY "appointments_v9_delete_fixed" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());

-- TEST : Vérifier que la fonction get_current_user_email fonctionne
SELECT public.get_current_user_email() as user_email_test;

-- VÉRIFICATION : Simuler ce que verra l'utilisateur maintenant
SELECT 
    id,
    professional_id,
    status,
    start_time,
    'TEST_POLITIQUE_V9_FIXED' as verification
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef';
