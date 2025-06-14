
-- Ajouter une contrainte d'unicité sur le champ email de la table intervenants
ALTER TABLE public.intervenants
ADD CONSTRAINT unique_intervenant_email UNIQUE(email);
