
-- Créer une table pour stocker les tags de sous-activités sans RLS
CREATE TABLE public.activity_sub_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, created_by)
);

-- Ajouter une colonne sub_activity_tag_id à la table activities
ALTER TABLE public.activities 
ADD COLUMN sub_activity_tag_id uuid REFERENCES public.activity_sub_tags(id) ON DELETE SET NULL;

-- Désactiver RLS sur la nouvelle table (pas de politiques RLS)
ALTER TABLE public.activity_sub_tags DISABLE ROW LEVEL SECURITY;
