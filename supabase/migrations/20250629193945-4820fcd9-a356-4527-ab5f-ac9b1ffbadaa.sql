
-- Supprimer la contrainte d'unicité existante sur le nom seul
ALTER TABLE blog_albums DROP CONSTRAINT IF EXISTS blog_albums_name_key;

-- Ajouter une contrainte d'unicité composite (nom + author_id)
-- Cela permet à différents utilisateurs d'avoir des albums avec le même nom
-- mais empêche un même utilisateur d'avoir plusieurs albums avec le même nom
ALTER TABLE blog_albums ADD CONSTRAINT blog_albums_name_author_unique UNIQUE (name, author_id);
