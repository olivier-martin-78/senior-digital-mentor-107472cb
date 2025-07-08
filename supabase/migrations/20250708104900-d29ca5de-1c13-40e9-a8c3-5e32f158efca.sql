-- Corriger les politiques RLS pour empêcher l'accès aux brouillons par les invités

-- 1. Supprimer les anciennes politiques pour blog_posts
DROP POLICY IF EXISTS "Users can view own posts and posts from same group optimized" ON public.blog_posts;

-- 2. Créer une nouvelle politique pour blog_posts qui filtre les brouillons
CREATE POLICY "Users can view own posts and published posts from same group" 
ON public.blog_posts 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres posts (publiés ET brouillons)
  author_id = auth.uid()
  OR
  -- L'utilisateur peut voir les posts PUBLIÉS des membres de son groupe
  (
    published = true 
    AND EXISTS (
      SELECT 1
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = blog_posts.author_id
    )
  )
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 3. Supprimer les anciennes politiques pour wish_posts s'il y en a
DROP POLICY IF EXISTS "Users can view own wishes and wishes from same group optimized" ON public.wish_posts;

-- 4. Créer une nouvelle politique pour wish_posts qui filtre les brouillons
CREATE POLICY "Users can view own wishes and published wishes from same group" 
ON public.wish_posts 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres souhaits (publiés ET brouillons)
  author_id = auth.uid()
  OR
  -- L'utilisateur peut voir les souhaits PUBLIÉS des membres de son groupe
  (
    published = true 
    AND EXISTS (
      SELECT 1
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = wish_posts.author_id
    )
  )
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);