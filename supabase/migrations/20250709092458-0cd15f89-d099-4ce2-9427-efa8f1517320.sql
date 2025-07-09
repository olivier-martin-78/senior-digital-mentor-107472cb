-- Implémentation du partage global de contenu
-- Ajouter les colonnes shared_globally aux tables principales

-- Ajouter shared_globally à blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN shared_globally boolean DEFAULT false;

-- Ajouter shared_globally à diary_entries  
ALTER TABLE public.diary_entries 
ADD COLUMN shared_globally boolean DEFAULT false;

-- Ajouter shared_globally à wish_posts
ALTER TABLE public.wish_posts 
ADD COLUMN shared_globally boolean DEFAULT false;

-- Ajouter shared_globally à life_stories
ALTER TABLE public.life_stories 
ADD COLUMN shared_globally boolean DEFAULT false;

-- Mettre à jour les politiques RLS pour blog_posts
DROP POLICY IF EXISTS "Users can view own posts and published posts from same group or" ON public.blog_posts;

CREATE POLICY "Users can view own posts and published posts from same group or global" 
ON public.blog_posts 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres articles (publiés ET brouillons)
  author_id = auth.uid()
  OR
  -- L'utilisateur peut voir les articles PUBLIÉS des membres de son groupe
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
  -- L'utilisateur peut voir les articles PUBLIÉS des membres des groupes qu'il a créés
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
  -- Les invités peuvent voir les articles PUBLIÉS du créateur de leur groupe
  (
    published = true 
    AND EXISTS (
      SELECT 1 
      FROM group_members gm
      JOIN invitation_groups ig ON gm.group_id = ig.id
      WHERE gm.user_id = auth.uid() 
      AND gm.role = 'guest'
      AND ig.created_by = blog_posts.author_id
    )
  )
  OR
  -- NOUVEAU: Contenu partagé globalement - visible par tous les utilisateurs authentifiés
  (published = true AND shared_globally = true)
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Mettre à jour les politiques RLS pour diary_entries
DROP POLICY IF EXISTS "Users can view own diary and diary from same group optimized" ON public.diary_entries;

CREATE POLICY "Users can view own diary and diary from same group or global optimized" 
ON public.diary_entries 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres entrées
  user_id = auth.uid()
  OR
  -- L'utilisateur peut voir les entrées des membres de son groupe
  EXISTS (
    SELECT 1
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = diary_entries.user_id
  )
  OR
  -- NOUVEAU: Contenu partagé globalement - visible par tous les utilisateurs authentifiés
  shared_globally = true
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Mettre à jour les politiques RLS pour wish_posts (inclure le partage global)
DROP POLICY IF EXISTS "Users can view own wishes and published wishes from same group or created groups" ON public.wish_posts;

CREATE POLICY "Users can view own wishes and published wishes from same group or global" 
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
  -- Les invités peuvent voir les souhaits PUBLIÉS du créateur de leur groupe
  (
    published = true 
    AND EXISTS (
      SELECT 1 
      FROM group_members gm
      JOIN invitation_groups ig ON gm.group_id = ig.id
      WHERE gm.user_id = auth.uid() 
      AND gm.role = 'guest'
      AND ig.created_by = wish_posts.author_id
    )
  )
  OR
  -- NOUVEAU: Contenu partagé globalement - visible par tous les utilisateurs authentifiés
  (published = true AND shared_globally = true)
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Mettre à jour les politiques RLS pour life_stories
DROP POLICY IF EXISTS "Users can view own life stories and stories from same group opt" ON public.life_stories;

CREATE POLICY "Users can view own life stories and stories from same group or global optimized" 
ON public.life_stories 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres histoires
  user_id = auth.uid()
  OR
  -- L'utilisateur peut voir les histoires des membres de son groupe
  EXISTS (
    SELECT 1
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = life_stories.user_id
  )
  OR
  -- NOUVEAU: Contenu partagé globalement - visible par tous les utilisateurs authentifiés
  shared_globally = true
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);