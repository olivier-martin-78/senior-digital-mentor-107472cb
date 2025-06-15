
-- Supprimer les politiques V5 actuelles qui causent l'erreur
DROP POLICY IF EXISTS "appointments_final_v5_select_only_owner_or_exact_email_match" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_v5_insert_only_creator" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_v5_update_only_creator_or_exact_intervenant" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_v5_delete_only_creator" ON public.appointments;

-- Créer une fonction security definer pour obtenir l'email de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- ÉTAPE 1: Nouvelle politique SELECT V6 ultra-stricte avec fonction security definer
CREATE POLICY "appointments_final_v6_select_only_owner_or_exact_email_match" 
ON public.appointments 
FOR SELECT 
USING (
  -- L'utilisateur est le créateur du rendez-vous
  professional_id = auth.uid() 
  OR 
  -- L'utilisateur est l'intervenant avec email EXACTEMENT identique
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      WHERE i.id = appointments.intervenant_id 
      AND i.email = public.get_current_user_email()
      AND i.email IS NOT NULL
      AND public.get_current_user_email() IS NOT NULL
    )
  )
);

-- ÉTAPE 2: Nouvelle politique INSERT V6
CREATE POLICY "appointments_final_v6_insert_only_creator" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- ÉTAPE 3: Nouvelle politique UPDATE V6
CREATE POLICY "appointments_final_v6_update_only_creator_or_exact_intervenant" 
ON public.appointments 
FOR UPDATE 
USING (
  professional_id = auth.uid() 
  OR 
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      WHERE i.id = appointments.intervenant_id 
      AND i.email = public.get_current_user_email()
      AND i.email IS NOT NULL
      AND public.get_current_user_email() IS NOT NULL
    )
  )
)
WITH CHECK (professional_id = auth.uid());

-- ÉTAPE 4: Nouvelle politique DELETE V6
CREATE POLICY "appointments_final_v6_delete_only_creator" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());
