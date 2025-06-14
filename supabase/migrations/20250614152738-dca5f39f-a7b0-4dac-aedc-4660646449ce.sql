
-- Force la suppression COMPLÈTE de toutes les politiques RLS sur appointments
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "ULTRA_STRICT_appointments_delete" ON public.appointments;

-- Désactiver temporairement RLS pour nettoyer
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Créer des politiques EXTRÊMEMENT strictes avec noms uniques
CREATE POLICY "appointments_hyperstric_select_v2" 
ON public.appointments 
FOR SELECT 
USING (
  -- SEULE CONDITION AUTORISÉE: L'utilisateur est le créateur ET SEULEMENT LE CRÉATEUR
  professional_id = auth.uid()
  -- SUPPRESSION COMPLÈTE de la condition intervenant pour test
);

-- Politique INSERT ultra-simple
CREATE POLICY "appointments_hyperstric_insert_v2" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- Politique UPDATE ultra-simple - SEULEMENT pour les créateurs
CREATE POLICY "appointments_hyperstric_update_v2" 
ON public.appointments 
FOR UPDATE 
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- Politique DELETE ultra-simple - SEULEMENT pour les créateurs
CREATE POLICY "appointments_hyperstric_delete_v2" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());
