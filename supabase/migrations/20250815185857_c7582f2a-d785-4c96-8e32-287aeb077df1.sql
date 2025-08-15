-- Créer les politiques RLS pour le bucket memory_game_images

-- Politique pour permettre aux utilisateurs autorisés d'uploader des images
CREATE POLICY "Users with create activities permission can upload memory game images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'memory_game_images' AND
  auth.uid() IS NOT NULL AND
  (
    can_create_activities(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
);

-- Politique pour permettre aux utilisateurs autorisés de mettre à jour leurs images
CREATE POLICY "Users with create activities permission can update memory game images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'memory_game_images' AND
  auth.uid() IS NOT NULL AND
  (
    can_create_activities(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
);

-- Politique pour permettre aux utilisateurs autorisés de supprimer leurs images
CREATE POLICY "Users with create activities permission can delete memory game images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'memory_game_images' AND
  auth.uid() IS NOT NULL AND
  (
    can_create_activities(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
);

-- Vérifier et créer les mêmes politiques pour le bucket activity-thumbnails si elles n'existent pas
CREATE POLICY "Users with create activities permission can upload activity thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'activity-thumbnails' AND
  auth.uid() IS NOT NULL AND
  (
    can_create_activities(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
);

CREATE POLICY "Users with create activities permission can update activity thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'activity-thumbnails' AND
  auth.uid() IS NOT NULL AND
  (
    can_create_activities(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
);

CREATE POLICY "Users with create activities permission can delete activity thumbnails" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'activity-thumbnails' AND
  auth.uid() IS NOT NULL AND
  (
    can_create_activities(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
);