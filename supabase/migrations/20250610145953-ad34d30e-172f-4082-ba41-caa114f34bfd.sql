
-- Ajouter une colonne created_by à la table blog_categories
ALTER TABLE public.blog_categories 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mettre à jour les catégories existantes pour leur attribuer un créateur par défaut
-- (attribuer au premier admin trouvé, ou au premier utilisateur)
UPDATE public.blog_categories 
SET created_by = (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- Si aucun admin n'existe, attribuer au premier utilisateur
UPDATE public.blog_categories 
SET created_by = (
  SELECT id FROM auth.users LIMIT 1
)
WHERE created_by IS NULL;

-- Rendre la colonne created_by obligatoire
ALTER TABLE public.blog_categories 
ALTER COLUMN created_by SET NOT NULL;
