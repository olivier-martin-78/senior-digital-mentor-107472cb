-- Créer le bucket pour les fichiers audio de dictée
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dictation-audios', 'dictation-audios', true);

-- Créer les politiques pour permettre l'upload et la lecture
CREATE POLICY "Allow public access to dictation audios" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'dictation-audios');

CREATE POLICY "Allow authenticated users to upload dictation audios" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'dictation-audios' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own dictation audios" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'dictation-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own dictation audios" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'dictation-audios' AND auth.uid()::text = (storage.foldername(name))[1]);