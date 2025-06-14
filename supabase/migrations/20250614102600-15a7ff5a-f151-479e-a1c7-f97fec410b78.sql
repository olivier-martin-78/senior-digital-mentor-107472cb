
-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "appointments_ultra_strict_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_strict_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_strict_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_strict_delete_policy" ON public.appointments;

-- Créer une fonction de debug pour vérifier la correspondance email
CREATE OR REPLACE FUNCTION debug_email_match(appointment_intervenant_id uuid, current_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  intervenant_email text;
  user_email text;
  result boolean := false;
BEGIN
  -- Récupérer l'email de l'intervenant
  SELECT email INTO intervenant_email 
  FROM public.intervenants 
  WHERE id = appointment_intervenant_id;
  
  -- Récupérer l'email de l'utilisateur connecté
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Vérifier la correspondance exacte
  IF intervenant_email IS NOT NULL AND user_email IS NOT NULL AND intervenant_email = user_email THEN
    result := true;
  END IF;
  
  RETURN result;
END;
$$;

-- Nouvelle politique SELECT avec vérification stricte
CREATE POLICY "appointments_final_strict_select_policy" 
ON public.appointments 
FOR SELECT
USING (
  -- CONDITION 1: L'utilisateur est le professionnel créateur
  auth.uid() = professional_id 
  OR 
  -- CONDITION 2: Correspondance exacte email intervenant/utilisateur
  (
    intervenant_id IS NOT NULL AND
    debug_email_match(intervenant_id, auth.uid()) = true
  )
);

-- Politique pour INSERT
CREATE POLICY "appointments_final_strict_insert_policy" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

-- Politique pour UPDATE
CREATE POLICY "appointments_final_strict_update_policy" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- Politique pour DELETE
CREATE POLICY "appointments_final_strict_delete_policy" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);
