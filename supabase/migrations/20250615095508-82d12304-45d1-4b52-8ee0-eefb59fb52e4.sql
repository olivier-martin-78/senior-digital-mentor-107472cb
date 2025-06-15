
-- Supprimer les politiques V6 problématiques
DROP POLICY IF EXISTS "appointments_final_v6_select_only_owner_or_exact_email_match" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_v6_insert_only_creator" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_v6_update_only_creator_or_exact_intervenant" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_v6_delete_only_creator" ON public.appointments;

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.get_current_user_email();

-- Créer une nouvelle fonction security definer optimisée
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- ÉTAPE 1: Nouvelle politique SELECT V7 - simple et robuste
CREATE POLICY "appointments_v7_select_creator_or_intervenant" 
ON public.appointments 
FOR SELECT 
USING (
  -- L'utilisateur est le créateur du rendez-vous (toujours visible)
  professional_id = auth.uid() 
  OR 
  -- L'utilisateur est l'intervenant avec email correspondant
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      WHERE i.id = appointments.intervenant_id 
      AND i.email = public.get_current_user_email()
    )
  )
);

-- ÉTAPE 2: Politique INSERT V7
CREATE POLICY "appointments_v7_insert_creator_only" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- ÉTAPE 3: Politique UPDATE V7 - simplifiée
CREATE POLICY "appointments_v7_update_creator_and_intervenant" 
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
    )
  )
);

-- ÉTAPE 4: Politique DELETE V7 - seulement pour les créateurs
CREATE POLICY "appointments_v7_delete_creator_only" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());
