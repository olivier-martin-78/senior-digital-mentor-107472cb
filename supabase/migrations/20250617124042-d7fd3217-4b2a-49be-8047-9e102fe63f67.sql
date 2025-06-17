
-- Ajouter la colonne activity_type à la table activity_sub_tags
ALTER TABLE public.activity_sub_tags 
ADD COLUMN activity_type text NOT NULL DEFAULT 'meditation';

-- Mettre à jour la contrainte d'unicité pour inclure activity_type
ALTER TABLE public.activity_sub_tags 
DROP CONSTRAINT activity_sub_tags_name_created_by_key;

ALTER TABLE public.activity_sub_tags 
ADD CONSTRAINT activity_sub_tags_name_created_by_activity_type_key 
UNIQUE(name, created_by, activity_type);
