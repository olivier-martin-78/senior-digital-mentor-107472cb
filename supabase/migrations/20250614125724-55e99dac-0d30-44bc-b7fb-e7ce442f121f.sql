
-- Supprimer la fonction de debug existante
DROP FUNCTION IF EXISTS public.debug_email_match(uuid, uuid);

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "appointments_definitive_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_definitive_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_definitive_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_definitive_delete_policy" ON public.appointments;

-- Créer une fonction ultra-stricte pour vérifier la correspondance email
CREATE OR REPLACE FUNCTION public.check_intervenant_email_match(appointment_intervenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  intervenant_email text;
  current_user_email text;
BEGIN
  -- Récupérer l'email de l'intervenant du rendez-vous
  SELECT email INTO intervenant_email 
  FROM public.intervenants 
  WHERE id = appointment_intervenant_id;
  
  -- Récupérer l'email de l'utilisateur connecté
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Retourner true seulement si les emails correspondent exactement
  RETURN (intervenant_email IS NOT NULL 
          AND current_user_email IS NOT NULL 
          AND intervenant_email = current_user_email);
END;
$$;

-- Politique SELECT ultra-stricte
CREATE POLICY "appointments_ultra_strict_final_policy" 
ON public.appointments 
FOR SELECT
USING (
  -- SOIT l'utilisateur est le créateur du rendez-vous
  auth.uid() = professional_id 
  OR 
  -- SOIT l'utilisateur est l'intervenant avec email strictement identique
  (
    intervenant_id IS NOT NULL 
    AND public.check_intervenant_email_match(intervenant_id) = true
  )
);

-- Politiques pour les autres opérations - seulement pour les créateurs
CREATE POLICY "appointments_ultra_strict_insert_policy" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "appointments_ultra_strict_update_policy" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "appointments_ultra_strict_delete_policy" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);
