
-- Créer un bucket pour stocker les vignettes d'activités
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-thumbnails', 'activity-thumbnails', true);

-- Créer une politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload activity thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'activity-thumbnails' AND 
  auth.role() = 'authenticated'
);

-- Créer une politique pour permettre la lecture publique
CREATE POLICY "Public access to activity thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'activity-thumbnails');

-- Créer une politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update activity thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'activity-thumbnails' AND 
  auth.role() = 'authenticated'
);

-- Créer une politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete activity thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'activity-thumbnails' AND 
  auth.role() = 'authenticated'
);
