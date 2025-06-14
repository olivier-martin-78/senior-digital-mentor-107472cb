
-- ÉTAPE 1: Supprimer la politique restante qui utilise la fonction
DROP POLICY IF EXISTS "appointments_ultra_strict_final_policy" ON public.appointments;

-- ÉTAPE 2: Supprimer maintenant la fonction
DROP FUNCTION IF EXISTS public.check_intervenant_email_match(uuid);

-- ÉTAPE 3: Supprimer ABSOLUMENT TOUTES les autres politiques RLS existantes sur appointments
DROP POLICY IF EXISTS "appointments_ultra_final_strict_select_v4" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_final_strict_insert_v4" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_final_strict_update_v4" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_final_strict_delete_v4" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_strict_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_strict_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_ultra_strict_delete_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_select_v3" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_insert_v3" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_update_v3" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_delete_v3" ON public.appointments;

-- Supprimer toutes les autres politiques qui pourraient exister
DROP POLICY IF EXISTS "Authenticated users can access appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;

-- ÉTAPE 4: Désactiver temporairement RLS pour nettoyer complètement
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 5: Réactiver RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 6: Créer UNE SEULE politique SELECT ultra-stricte avec nom unique
CREATE POLICY "appointments_final_v5_select_only_owner_or_exact_email_match" 
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
      AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND i.email IS NOT NULL
      AND (SELECT email FROM auth.users WHERE id = auth.uid()) IS NOT NULL
    )
  )
);

-- ÉTAPE 7: Créer UNE SEULE politique INSERT stricte
CREATE POLICY "appointments_final_v5_insert_only_creator" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- ÉTAPE 8: Créer UNE SEULE politique UPDATE stricte
CREATE POLICY "appointments_final_v5_update_only_creator_or_exact_intervenant" 
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
      AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND i.email IS NOT NULL
      AND (SELECT email FROM auth.users WHERE id = auth.uid()) IS NOT NULL
    )
  )
)
WITH CHECK (professional_id = auth.uid());

-- ÉTAPE 9: Créer UNE SEULE politique DELETE stricte
CREATE POLICY "appointments_final_v5_delete_only_creator" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());
