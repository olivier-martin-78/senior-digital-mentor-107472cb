
-- Créer le bucket pour les audios d'intervention s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('intervention-audio', 'intervention-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux professionnels d'uploader leurs audios
CREATE POLICY "Professionnels peuvent uploader leurs audios" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'intervention-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux professionnels de lire leurs audios
CREATE POLICY "Professionnels peuvent lire leurs audios" ON storage.objects
FOR SELECT USING (
  bucket_id = 'intervention-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux professionnels de supprimer leurs audios
CREATE POLICY "Professionnels peuvent supprimer leurs audios" ON storage.objects
FOR DELETE USING (
  bucket_id = 'intervention-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
