
-- Créer la table pour les messages de coordination
CREATE TABLE public.caregiver_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Activer RLS sur la table caregiver_messages
ALTER TABLE public.caregiver_messages ENABLE ROW LEVEL SECURITY;

-- Politique pour que les proches aidants puissent voir les messages des clients dont ils s'occupent
CREATE POLICY "Caregivers can view messages for their clients"
ON public.caregiver_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.caregivers c
    WHERE c.client_id = caregiver_messages.client_id
    AND c.email = get_current_user_email()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.client_id = caregiver_messages.client_id
    AND a.professional_id = auth.uid()
  )
);

-- Politique pour que les proches aidants puissent créer des messages pour leurs clients
CREATE POLICY "Caregivers can create messages for their clients"
ON public.caregiver_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.caregivers c
    WHERE c.client_id = caregiver_messages.client_id
    AND c.email = get_current_user_email()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.client_id = caregiver_messages.client_id
    AND a.professional_id = auth.uid()
  )
);

-- Politique pour que les auteurs puissent modifier leurs propres messages
CREATE POLICY "Authors can update their own messages"
ON public.caregiver_messages
FOR UPDATE
USING (author_id = auth.uid());

-- Politique pour que les auteurs puissent supprimer leurs propres messages
CREATE POLICY "Authors can delete their own messages"
ON public.caregiver_messages
FOR DELETE
USING (author_id = auth.uid());

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_caregiver_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_caregiver_messages_updated_at
  BEFORE UPDATE ON public.caregiver_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_caregiver_messages_updated_at();
