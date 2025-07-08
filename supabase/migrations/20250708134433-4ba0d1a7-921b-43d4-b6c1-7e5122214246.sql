-- Ajouter les politiques RLS manquantes pour blog_posts

-- Politique pour permettre la création d'articles
CREATE POLICY "Users can create blog posts" ON public.blog_posts
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

-- Politique pour permettre la modification d'articles (par l'auteur ou admin)
CREATE POLICY "Users can update their own blog posts" ON public.blog_posts
  FOR UPDATE 
  USING (auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Politique pour permettre la suppression d'articles (par l'auteur ou admin)
CREATE POLICY "Users can delete their own blog posts" ON public.blog_posts
  FOR DELETE 
  USING (auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));