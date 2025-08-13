-- Ajouter la colonne background_color à la table mini_sites
ALTER TABLE public.mini_sites 
ADD COLUMN background_color text DEFAULT NULL;