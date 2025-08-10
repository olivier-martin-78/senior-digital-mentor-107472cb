-- Ajouter support pour les vidéos dans les slides du carrousel
ALTER TABLE public.homepage_slides 
ADD COLUMN media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- Renommer image_url en media_url pour plus de clarté
ALTER TABLE public.homepage_slides 
RENAME COLUMN image_url TO media_url;