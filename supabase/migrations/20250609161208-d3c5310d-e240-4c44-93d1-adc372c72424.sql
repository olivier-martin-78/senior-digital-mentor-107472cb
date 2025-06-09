
-- Ajouter les champs vignette et date à la table activities
ALTER TABLE public.activities 
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN activity_date DATE;
