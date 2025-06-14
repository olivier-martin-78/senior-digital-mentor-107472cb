
-- Supprimer toutes les politiques RLS existantes sur appointments
DROP POLICY IF EXISTS "appointments_final_strict_select_v3" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_insert_v3" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_update_v3" ON public.appointments;
DROP POLICY IF EXISTS "appointments_final_strict_delete_v3" ON public.appointments;

-- Désactiver temporairement RLS pour nettoyer complètement
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Politique SELECT ULTRA-STRICTE : SEULEMENT le créateur OU l'intervenant avec email EXACTEMENT identique pour CE rendez-vous
CREATE POLICY "appointments_ultra_final_strict_select_v4" 
ON public.appointments 
FOR SELECT 
USING (
  -- L'utilisateur est le créateur du rendez-vous
  professional_id = auth.uid() 
  OR 
  -- L'utilisateur est l'intervenant spécifique de CE rendez-vous avec email strictement identique
  (
    intervenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.intervenants i
      WHERE i.id = appointments.intervenant_id 
      AND i.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND i.email IS NOT NULL
    )
  )
);

-- Politique INSERT : Seuls les créateurs peuvent créer
CREATE POLICY "appointments_ultra_final_strict_insert_v4" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- Politique UPDATE : Le créateur OU l'intervenant avec email identique peuvent modifier
CREATE POLICY "appointments_ultra_final_strict_update_v4" 
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
      AND i.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND i.email IS NOT NULL
    )
  )
)
WITH CHECK (professional_id = auth.uid());

-- Politique DELETE : Seul le créateur peut supprimer
CREATE POLICY "appointments_ultra_final_strict_delete_v4" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());
