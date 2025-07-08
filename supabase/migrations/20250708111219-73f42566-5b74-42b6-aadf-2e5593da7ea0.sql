-- Correction des politiques RLS pour permettre aux créateurs de groupe de voir les contenus publiés de leurs invités

-- 1. Corriger la politique pour blog_posts
DROP POLICY IF EXISTS "Users can view own posts and published posts from same group" ON public.blog_posts;

CREATE POLICY "Users can view own posts and published posts from same group or created groups" 
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
  -- L'utilisateur peut voir les posts PUBLIÉS des membres des groupes qu'il a créés
  (
    published = true 
    AND EXISTS (
      SELECT 1
      FROM invitation_groups ig
      JOIN group_members gm ON ig.id = gm.group_id
      WHERE ig.created_by = auth.uid()
      AND gm.user_id = blog_posts.author_id
    )
  )
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Corriger la politique pour wish_posts
DROP POLICY IF EXISTS "Users can view own wishes and published wishes from same group" ON public.wish_posts;

CREATE POLICY "Users can view own wishes and published wishes from same group or created groups" 
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
  -- L'utilisateur peut voir les souhaits PUBLIÉS des membres des groupes qu'il a créés
  (
    published = true 
    AND EXISTS (
      SELECT 1
      FROM invitation_groups ig
      JOIN group_members gm ON ig.id = gm.group_id
      WHERE ig.created_by = auth.uid()
      AND gm.user_id = wish_posts.author_id
    )
  )
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);