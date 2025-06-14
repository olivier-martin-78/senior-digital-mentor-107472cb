
-- Supprimer toutes les politiques RLS existantes sur appointments
DROP POLICY IF EXISTS "appointments_hyperstric_select_v2" ON public.appointments;
DROP POLICY IF EXISTS "appointments_hyperstric_insert_v2" ON public.appointments;
DROP POLICY IF EXISTS "appointments_hyperstric_update_v2" ON public.appointments;
DROP POLICY IF EXISTS "appointments_hyperstric_delete_v2" ON public.appointments;

-- Supprimer aussi toutes les autres politiques qui pourraient exister
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_delete" ON public.appointments;

-- Désactiver temporairement RLS pour nettoyer complètement
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Politique SELECT ultra-stricte : SEULEMENT le créateur OU l'intervenant avec email exact
CREATE POLICY "appointments_final_strict_select_v3" 
ON public.appointments 
FOR SELECT 
USING (
  -- L'utilisateur est le créateur du rendez-vous
  professional_id = auth.uid() 
  OR 
  -- L'utilisateur est l'intervenant avec email strictement identique
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

-- Politique INSERT : Seuls les créateurs peuvent créer
CREATE POLICY "appointments_final_strict_insert_v3" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- Politique UPDATE : Le créateur OU l'intervenant avec email identique peuvent modifier
CREATE POLICY "appointments_final_strict_update_v3" 
ON public.appointments 
FOR UPDATE 
USING (
  professional_id = auth.uid() 
  OR 
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
)
WITH CHECK (professional_id = auth.uid());

-- Politique DELETE : Seul le créateur peut supprimer
CREATE POLICY "appointments_final_strict_delete_v3" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());
