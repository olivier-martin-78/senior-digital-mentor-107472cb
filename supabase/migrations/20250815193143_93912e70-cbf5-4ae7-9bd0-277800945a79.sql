-- Ajouter la colonne duration à la table mini_site_media
ALTER TABLE public.mini_site_media 
ADD COLUMN duration INTEGER DEFAULT 5 CHECK (duration >= 1 AND duration <= 60);

-- Mettre à jour les enregistrements existants avec une valeur par défaut
UPDATE public.mini_site_media 
SET duration = 5 
WHERE duration IS NULL;

-- Ajouter un commentaire pour expliquer la colonne
COMMENT ON COLUMN public.mini_site_media.duration IS 'Durée d''affichage du média en secondes (1-60)';