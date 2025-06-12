
-- Ajouter les nouveaux champs à la table clients
ALTER TABLE public.clients 
ADD COLUMN postal_code VARCHAR(10),
ADD COLUMN city VARCHAR(100),
ADD COLUMN comment TEXT;
