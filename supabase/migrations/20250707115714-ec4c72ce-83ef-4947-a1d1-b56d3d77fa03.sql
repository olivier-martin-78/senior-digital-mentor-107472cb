
-- Ajouter une politique RLS pour permettre aux aidants de voir les appointments des clients qu'ils accompagnent
CREATE POLICY "Caregivers can view appointments for their clients"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.caregivers c
    WHERE c.client_id = appointments.client_id
    AND c.email = get_current_user_email()
  )
);

-- Ajouter une politique RLS pour permettre aux aidants de voir les rapports d'intervention des clients qu'ils accompagnent
CREATE POLICY "Caregivers can view intervention reports for their clients"
ON public.intervention_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.caregivers c ON a.client_id = c.client_id
    WHERE a.id = intervention_reports.appointment_id
    AND c.email = get_current_user_email()
  )
);
