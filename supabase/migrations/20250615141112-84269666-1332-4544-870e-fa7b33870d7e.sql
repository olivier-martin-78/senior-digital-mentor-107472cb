
-- 1. Vérifier et corriger les relations entre intervention_reports et appointments
-- Il semble y avoir une ambiguïté dans la relation, vérifions d'abord

-- 2. Créer des politiques RLS pour permettre aux intervenants d'accéder aux rapports
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "intervention_reports_professional_access" ON public.intervention_reports;
DROP POLICY IF EXISTS "intervention_reports_intervenant_access" ON public.intervention_reports;

-- Activer RLS sur intervention_reports si ce n'est pas déjà fait
ALTER TABLE public.intervention_reports ENABLE ROW LEVEL SECURITY;

-- Politique 1: Le professionnel créateur peut voir ses rapports
CREATE POLICY "intervention_reports_professional_access" 
ON public.intervention_reports 
FOR ALL 
USING (professional_id = auth.uid());

-- Politique 2: L'intervenant peut voir les rapports liés à ses rendez-vous
CREATE POLICY "intervention_reports_intervenant_access" 
ON public.intervention_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.intervenants i ON a.intervenant_id = i.id
    WHERE a.id = intervention_reports.appointment_id
    AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Politique 3: Accès via user_intervenant_permissions pour plus de flexibilité
CREATE POLICY "intervention_reports_via_permissions" 
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

-- Créer une fonction helper pour déboguer l'accès aux rapports
CREATE OR REPLACE FUNCTION public.debug_intervention_report_access(report_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_email text;
  report_data json;
  access_methods json;
BEGIN
  current_user_id := auth.uid();
  
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Récupérer les données du rapport
  SELECT to_json(ir.*) INTO report_data
  FROM public.intervention_reports ir
  WHERE ir.id = report_id_param;
  
  -- Vérifier les différentes méthodes d'accès
  SELECT json_build_object(
    'is_professional', EXISTS (
      SELECT 1 FROM public.intervention_reports ir
      WHERE ir.id = report_id_param AND ir.professional_id = current_user_id
    ),
    'is_intervenant_by_email', EXISTS (
      SELECT 1 FROM public.intervention_reports ir
      JOIN public.appointments a ON ir.appointment_id = a.id
      JOIN public.intervenants i ON a.intervenant_id = i.id
      WHERE ir.id = report_id_param AND i.email = current_user_email
    ),
    'has_intervenant_permission', EXISTS (
      SELECT 1 FROM public.intervention_reports ir
      JOIN public.appointments a ON ir.appointment_id = a.id
      JOIN public.user_intervenant_permissions uip ON a.intervenant_id = uip.intervenant_id
      WHERE ir.id = report_id_param AND uip.user_id = current_user_id
    )
  ) INTO access_methods;
  
  RETURN json_build_object(
    'user_id', current_user_id,
    'user_email', current_user_email,
    'report_id', report_id_param,
    'report_exists', report_data IS NOT NULL,
    'access_methods', access_methods
  );
END;
$$;
