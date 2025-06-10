
-- Ajouter une colonne created_by à la table activities pour traquer le créateur
ALTER TABLE public.activities 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mettre à jour les activités existantes pour leur attribuer un créateur par défaut
-- (vous pouvez ajuster cette requête selon vos besoins)
UPDATE public.activities 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- Rendre la colonne created_by obligatoire
ALTER TABLE public.activities 
ALTER COLUMN created_by SET NOT NULL;
