-- Ajouter une colonne pour la durée d'affichage personnalisée
ALTER TABLE public.homepage_slides 
ADD COLUMN display_duration_seconds integer NOT NULL DEFAULT 3;