-- Correction finale des politiques RLS pour empêcher l'accès aux brouillons par les invités

-- 1. Supprimer la politique permissive problématique pour blog_posts
DROP POLICY IF EXISTS "Authenticated users can access blog posts" ON public.blog_posts;

-- 2. Supprimer la politique permissive problématique pour wish_posts  
DROP POLICY IF EXISTS "Authenticated users can access wish posts" ON public.wish_posts;

-- Les nouvelles politiques restrictives créées précédemment restent en place:
-- - "Users can view own posts and published posts from same group" pour blog_posts
-- - "Users can view own wishes and published wishes from same group" pour wish_posts

-- Ces politiques garantissent que :
-- 1. Les auteurs voient tous leurs contenus (publiés ET brouillons)
-- 2. Les invités ne voient QUE les contenus publiés des membres de leur groupe
-- 3. Les admins voient tout