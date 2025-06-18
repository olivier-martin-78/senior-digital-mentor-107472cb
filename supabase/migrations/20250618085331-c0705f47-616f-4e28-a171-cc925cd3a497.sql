
-- Ajouter le champ inactive à la table clients
ALTER TABLE public.clients 
ADD COLUMN inactive boolean NOT NULL DEFAULT false;
