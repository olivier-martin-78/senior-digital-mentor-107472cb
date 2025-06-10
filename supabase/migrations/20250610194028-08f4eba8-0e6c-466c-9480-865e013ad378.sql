
-- =============================================================================
-- STRATÉGIE 1: POLITIQUES RLS PERMISSIVES - DÉPLOIEMENT SÉCURISÉ
-- =============================================================================
-- Cette migration active RLS avec des politiques permissives qui:
-- 1. Bloquent l'accès direct non authentifié à l'API
-- 2. Préservent totalement la logique applicative existante
-- 3. Permettent un rollback immédiat si nécessaire
-- =============================================================================

-- 📝 ÉTAPE 1: ACTIVER RLS SUR LES TABLES CRITIQUES
-- -----------------------------------------------------------------------------

-- Table diary_entries (données très sensibles)
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- Table life_stories (données très sensibles) 
ALTER TABLE public.life_stories ENABLE ROW LEVEL SECURITY;

-- Table blog_posts (contenu personnel)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Table wish_posts (souhaits personnels)
ALTER TABLE public.wish_posts ENABLE ROW LEVEL SECURITY;

-- Table blog_albums (albums personnels)
ALTER TABLE public.blog_albums ENABLE ROW LEVEL SECURITY;

-- Table wish_albums (albums de souhaits)
ALTER TABLE public.wish_albums ENABLE ROW LEVEL SECURITY;

-- 📝 ÉTAPE 2: CRÉER LES POLITIQUES PERMISSIVES
-- -----------------------------------------------------------------------------
-- Ces politiques permettent l'accès à tous les utilisateurs authentifiés
-- La logique de filtrage fine reste côté application (useGroupPermissions)

-- Politiques pour diary_entries
CREATE POLICY "Authenticated users can access diary entries" 
ON public.diary_entries 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (user_id = auth.uid());

-- Politiques pour life_stories
CREATE POLICY "Authenticated users can access life stories" 
ON public.life_stories 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (user_id = auth.uid());

-- Politiques pour blog_posts
CREATE POLICY "Authenticated users can access blog posts" 
ON public.blog_posts 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (author_id = auth.uid());

-- Politiques pour wish_posts
CREATE POLICY "Authenticated users can access wish posts" 
ON public.wish_posts 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (author_id = auth.uid());

-- Politiques pour blog_albums
CREATE POLICY "Authenticated users can access blog albums" 
ON public.blog_albums 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (author_id = auth.uid());

-- Politiques pour wish_albums
CREATE POLICY "Authenticated users can access wish albums" 
ON public.wish_albums 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (author_id = auth.uid());

-- 📝 ÉTAPE 3: ACTIVER RLS SUR LES TABLES AUXILIAIRES
-- -----------------------------------------------------------------------------

-- Table blog_media (liée aux posts)
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access blog media" 
ON public.blog_media 
FOR ALL 
TO authenticated 
USING (true);

-- Table blog_comments (commentaires des posts)
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access blog comments" 
ON public.blog_comments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (author_id = auth.uid());

-- 📝 ÉTAPE 4: LAISSER LES TABLES MOINS SENSIBLES SANS RLS
-- -----------------------------------------------------------------------------
-- Tables activities et activity_sub_tags restent sans RLS car:
-- - Contenu moins sensible (activités génériques)
-- - Pas de données personnelles identifiables
-- - Simplicité de maintenance

-- =============================================================================
-- COMMANDES DE ROLLBACK IMMÉDIAT (à utiliser en cas de problème)
-- =============================================================================

/*
-- ROLLBACK COMPLET - À EXÉCUTER SI DES PROBLÈMES SONT DÉTECTÉS:

-- Désactiver RLS sur toutes les tables
ALTER TABLE public.diary_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques créées
DROP POLICY IF EXISTS "Authenticated users can access diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Authenticated users can access life stories" ON public.life_stories;
DROP POLICY IF EXISTS "Authenticated users can access blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can access wish posts" ON public.wish_posts;
DROP POLICY IF EXISTS "Authenticated users can access blog albums" ON public.blog_albums;
DROP POLICY IF EXISTS "Authenticated users can access wish albums" ON public.wish_albums;
DROP POLICY IF EXISTS "Authenticated users can access blog media" ON public.blog_media;
DROP POLICY IF EXISTS "Authenticated users can access blog comments" ON public.blog_comments;
*/
