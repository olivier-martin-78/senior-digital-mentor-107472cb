
-- Créer une nouvelle politique RLS pour permettre aux caregivers et professionnels 
-- de mettre à jour SEULEMENT les champs notification_sent et notification_sent_at
CREATE POLICY "Caregivers and professionals can update notification status" 
ON public.caregiver_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.caregivers c
    WHERE c.client_id = caregiver_messages.client_id 
    AND c.email = get_current_user_email()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.client_id = caregiver_messages.client_id 
    AND a.professional_id = auth.uid()
  )
);
