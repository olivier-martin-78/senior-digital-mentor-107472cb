
-- Créer le bucket pour les audios d'intervention
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intervention-audios',
  'intervention-audios',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']
);

-- Politique pour permettre l'upload d'audios aux utilisateurs authentifiés
CREATE POLICY "Users can upload intervention audios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'intervention-audios' AND
  auth.role() = 'authenticated'
);

-- Politique pour permettre la lecture des audios aux utilisateurs authentifiés
CREATE POLICY "Users can view intervention audios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'intervention-audios' AND
  auth.role() = 'authenticated'
);

-- Politique pour permettre la suppression des audios aux utilisateurs authentifiés
CREATE POLICY "Users can delete intervention audios"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'intervention-audios' AND
  auth.role() = 'authenticated'
);
