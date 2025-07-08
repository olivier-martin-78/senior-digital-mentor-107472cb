-- Ajouter les politiques RLS manquantes pour wish_posts

-- Politique pour permettre la création de souhaits
CREATE POLICY "Users can create wishes" ON public.wish_posts
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

-- Politique pour permettre la modification de souhaits (y compris le statut)
CREATE POLICY "Users can update their own wishes" ON public.wish_posts
  FOR UPDATE 
  USING (auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Politique pour permettre la suppression de souhaits
CREATE POLICY "Users can delete their own wishes" ON public.wish_posts
  FOR DELETE 
  USING (auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));