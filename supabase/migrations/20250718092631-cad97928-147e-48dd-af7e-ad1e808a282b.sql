-- Créer le bucket de stockage pour les images des jeux de memory
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memory_game_images', 'memory_game_images', true)
ON CONFLICT (id) DO NOTHING;

-- Créer une politique pour permettre aux admins de télécharger des images
CREATE POLICY "Admins can upload memory game images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'memory_game_images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Créer une politique pour permettre à tous de voir les images
CREATE POLICY "Anyone can view memory game images"
ON storage.objects FOR SELECT
USING (bucket_id = 'memory_game_images');