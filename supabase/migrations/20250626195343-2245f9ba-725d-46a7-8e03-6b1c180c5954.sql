
-- Ajouter la colonne email_notification_sent à la table intervention_reports
ALTER TABLE public.intervention_reports 
ADD COLUMN email_notification_sent boolean DEFAULT false;
