
-- 1. Corriger les politiques RLS pour utiliser la fonction SECURITY DEFINER au lieu d'accéder directement à auth.users
-- Supprimer les politiques existantes qui causent l'erreur "permission denied for table users"
DROP POLICY IF EXISTS "intervention_reports_professional_access" ON public.intervention_reports;
DROP POLICY IF EXISTS "intervention_reports_intervenant_access" ON public.intervention_reports;
DROP POLICY IF EXISTS "intervention_reports_via_permissions" ON public.intervention_reports;

-- NOUVELLE POLITIQUE 1: Le professionnel créateur peut voir ses rapports
CREATE POLICY "intervention_reports_professional_access_v2" 
ON public.intervention_reports 
FOR ALL 
USING (professional_id = auth.uid());

-- NOUVELLE POLITIQUE 2: L'intervenant peut voir les rapports liés à ses rendez-vous (via email)
CREATE POLICY "intervention_reports_intervenant_email_access" 
ON public.intervention_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.intervenants i ON a.intervenant_id = i.id
    WHERE a.id = intervention_reports.appointment_id
    AND i.email = public.get_current_user_email()
  )
);

-- NOUVELLE POLITIQUE 3: Accès via user_intervenant_permissions pour plus de flexibilité
CREATE POLICY "intervention_reports_intervenant_permissions_access" 
ON public.intervention_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.user_intervenant_permissions uip ON a.intervenant_id = uip.intervenant_id
    WHERE a.id = intervention_reports.appointment_id
    AND uip.user_id = auth.uid()
  )
);

-- 2. Ajouter les permissions manquantes pour mtresor2008@gmail.com
-- D'abord, trouver l'intervenant olivier.fernandez15@sfr.fr et créer la permission
INSERT INTO public.user_intervenant_permissions (user_id, intervenant_id)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'mtresor2008@gmail.com'),
  i.id
FROM public.intervenants i
WHERE i.email = 'olivier.fernandez15@sfr.fr'
ON CONFLICT (user_id, intervenant_id) DO NOTHING;

-- 3. Créer une politique plus robuste pour les appointments qui utilise aussi la fonction SECURITY DEFINER
-- Vérifier d'abord les politiques existantes sur appointments
-- Supprimer les anciennes politiques qui pourraient causer des problèmes
DROP POLICY IF EXISTS "appointments_v9_select_fixed" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v9_insert_fixed" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v9_update_fixed" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v9_delete_fixed" ON public.appointments;

-- Nouvelles politiques pour appointments qui utilisent la fonction SECURITY DEFINER
CREATE POLICY "appointments_v11_select_secure" 
ON public.appointments 
FOR SELECT 
USING (
  -- RÈGLE 1 : Si tu as créé le RDV, tu le vois TOUJOURS
  professional_id = auth.uid()
  OR
  -- RÈGLE 2 : Si tu as modifié le RDV, tu le vois aussi
  updated_by_professional_id = auth.uid()
  OR
  -- RÈGLE 3 : Si tu es l'intervenant assigné (utiliser la fonction SECURITY DEFINER)
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = public.get_current_user_email()
  )
  OR
  -- RÈGLE 4 : Si tu as des permissions sur l'intervenant
  EXISTS (
    SELECT 1 FROM public.user_intervenant_permissions uip
    WHERE uip.intervenant_id = appointments.intervenant_id
    AND uip.user_id = auth.uid()
  )
);

-- POLITIQUE INSERT pour appointments
CREATE POLICY "appointments_v11_insert_secure" 
ON public.appointments 
FOR INSERT 
WITH CHECK (professional_id = auth.uid());

-- POLITIQUE UPDATE pour appointments
CREATE POLICY "appointments_v11_update_secure" 
ON public.appointments 
FOR UPDATE 
USING (
  professional_id = auth.uid()
  OR
  updated_by_professional_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = public.get_current_user_email()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_intervenant_permissions uip
    WHERE uip.intervenant_id = appointments.intervenant_id
    AND uip.user_id = auth.uid()
  )
);

-- POLITIQUE DELETE pour appointments
CREATE POLICY "appointments_v11_delete_secure" 
ON public.appointments 
FOR DELETE 
USING (professional_id = auth.uid());

-- 4. Vérification finale - tester la fonction debug avec le rapport problématique
SELECT public.debug_intervention_report_access('cf755426-3b0b-4ed3-8f97-cf29ae448be3'::uuid);
