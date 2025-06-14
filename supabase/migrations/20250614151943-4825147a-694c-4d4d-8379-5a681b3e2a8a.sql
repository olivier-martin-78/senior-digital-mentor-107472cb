
-- Réactiver RLS sur la table appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Professionnels peuvent voir leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Intervenants peuvent voir leurs rendez-vous assignés" ON public.appointments;
DROP POLICY IF EXISTS "Accès via permissions clients" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent créer leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent modifier leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent supprimer leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Intervenants peuvent modifier leurs rendez-vous" ON public.appointments;

-- Politique ULTRA-STRICTE pour SELECT : 
-- L'utilisateur peut voir SEULEMENT ses propres rendez-vous créés OU ceux où il est intervenant avec email EXACTEMENT identique
CREATE POLICY "ULTRA_STRICT_appointments_select" 
ON public.appointments 
FOR SELECT 
USING (
  -- L'utilisateur est le créateur du rendez-vous
  professional_id = auth.uid() 
  OR 
  -- L'utilisateur est l'intervenant avec email EXACTEMENT identique
  (intervenant_id IS NOT NULL AND public.check_intervenant_email_match(intervenant_id))
);

-- Politique pour INSERT : Seuls les créateurs peuvent créer
CREATE POLICY "ULTRA_STRICT_appointments_insert" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- Politique pour UPDATE : Le créateur OU l'intervenant avec email identique peuvent modifier
CREATE POLICY "ULTRA_STRICT_appointments_update" 
ON public.appointments 
FOR UPDATE 
USING (
  professional_id = auth.uid() 
  OR 
  (intervenant_id IS NOT NULL AND public.check_intervenant_email_match(intervenant_id))
);

-- Politique pour DELETE : Seul le créateur peut supprimer
CREATE POLICY "ULTRA_STRICT_appointments_delete" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());
