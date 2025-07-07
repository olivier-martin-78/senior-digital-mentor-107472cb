
-- Ajouter des champs pour tracker les notifications envoyées sur les messages
ALTER TABLE public.caregiver_messages 
ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN notification_sent_at TIMESTAMP WITH TIME ZONE NULL;

-- Créer un index pour optimiser les requêtes
CREATE INDEX idx_caregiver_messages_notification_sent ON public.caregiver_messages(notification_sent);
