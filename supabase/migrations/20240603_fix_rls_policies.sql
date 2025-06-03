
-- Supprimer les anciennes politiques RLS sur blog_posts
DROP POLICY IF EXISTS "Users can view their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can view posts they have access to" ON public.blog_posts;

-- Nouvelles politiques RLS pour blog_posts avec accès automatique via groupe
CREATE POLICY "Users can view own posts and posts from same group" 
ON public.blog_posts 
FOR SELECT 
USING (
  blog_posts.author_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = blog_posts.author_id
  )
);

CREATE POLICY "Users can create their own posts" 
ON public.blog_posts 
FOR INSERT 
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own posts" 
ON public.blog_posts 
FOR UPDATE 
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own posts" 
ON public.blog_posts 
FOR DELETE 
USING (author_id = auth.uid());

-- Supprimer les anciennes politiques RLS sur diary_entries
DROP POLICY IF EXISTS "Users can view their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can create their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can update their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can delete their own diary entries" ON public.diary_entries;

-- Nouvelles politiques RLS pour diary_entries
CREATE POLICY "Users can view own diary and diary from same group" 
ON public.diary_entries 
FOR SELECT 
USING (
  diary_entries.user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = diary_entries.user_id
  )
);

CREATE POLICY "Users can create their own diary entries" 
ON public.diary_entries 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own diary entries" 
ON public.diary_entries 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own diary entries" 
ON public.diary_entries 
FOR DELETE 
USING (user_id = auth.uid());

-- Supprimer les anciennes politiques RLS sur life_stories
DROP POLICY IF EXISTS "Users can view their own life stories" ON public.life_stories;
DROP POLICY IF EXISTS "Users can create their own life stories" ON public.life_stories;
DROP POLICY IF EXISTS "Users can update their own life stories" ON public.life_stories;
DROP POLICY IF EXISTS "Users can delete their own life stories" ON public.life_stories;

-- Nouvelles politiques RLS pour life_stories
CREATE POLICY "Users can view own life stories and stories from same group" 
ON public.life_stories 
FOR SELECT 
USING (
  life_stories.user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = life_stories.user_id
  )
);

CREATE POLICY "Users can create their own life stories" 
ON public.life_stories 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own life stories" 
ON public.life_stories 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own life stories" 
ON public.life_stories 
FOR DELETE 
USING (user_id = auth.uid());

-- Supprimer les anciennes politiques RLS sur wish_posts
DROP POLICY IF EXISTS "Users can view their own wishes" ON public.wish_posts;
DROP POLICY IF EXISTS "Users can create their own wishes" ON public.wish_posts;
DROP POLICY IF EXISTS "Users can update their own wishes" ON public.wish_posts;
DROP POLICY IF EXISTS "Users can delete their own wishes" ON public.wish_posts;

-- Nouvelles politiques RLS pour wish_posts
CREATE POLICY "Users can view own wishes and wishes from same group" 
ON public.wish_posts 
FOR SELECT 
USING (
  wish_posts.author_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = wish_posts.author_id
  )
);

CREATE POLICY "Users can create their own wishes" 
ON public.wish_posts 
FOR INSERT 
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own wishes" 
ON public.wish_posts 
FOR UPDATE 
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own wishes" 
ON public.wish_posts 
FOR DELETE 
USING (author_id = auth.uid());

-- Nouvelles politiques RLS pour les albums (blog_albums)
DROP POLICY IF EXISTS "Users can view their own albums" ON public.blog_albums;
DROP POLICY IF EXISTS "Users can create their own albums" ON public.blog_albums;
DROP POLICY IF EXISTS "Users can update their own albums" ON public.blog_albums;
DROP POLICY IF EXISTS "Users can delete their own albums" ON public.blog_albums;

CREATE POLICY "Users can view own albums and albums from same group" 
ON public.blog_albums 
FOR SELECT 
USING (
  blog_albums.author_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = blog_albums.author_id
  )
);

CREATE POLICY "Users can create their own albums" 
ON public.blog_albums 
FOR INSERT 
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own albums" 
ON public.blog_albums 
FOR UPDATE 
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own albums" 
ON public.blog_albums 
FOR DELETE 
USING (author_id = auth.uid());

-- Nouvelles politiques RLS pour les albums de souhaits (wish_albums)
DROP POLICY IF EXISTS "Users can view their own wish albums" ON public.wish_albums;
DROP POLICY IF EXISTS "Users can create their own wish albums" ON public.wish_albums;
DROP POLICY IF EXISTS "Users can update their own wish albums" ON public.wish_albums;
DROP POLICY IF EXISTS "Users can delete their own wish albums" ON public.wish_albums;

CREATE POLICY "Users can view own wish albums and albums from same group" 
ON public.wish_albums 
FOR SELECT 
USING (
  wish_albums.author_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = wish_albums.author_id
  )
);

CREATE POLICY "Users can create their own wish albums" 
ON public.wish_albums 
FOR INSERT 
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own wish albums" 
ON public.wish_albums 
FOR UPDATE 
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own wish albums" 
ON public.wish_albums 
FOR DELETE 
USING (author_id = auth.uid());

-- Activer RLS sur toutes les tables si ce n'est pas déjà fait
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_albums ENABLE ROW LEVEL SECURITY;
