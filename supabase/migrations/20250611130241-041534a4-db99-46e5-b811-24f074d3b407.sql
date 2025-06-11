
-- Créer un bucket dédié pour les audios d'intervention
INSERT INTO storage.buckets (id, name, public)
VALUES ('intervention-audios', 'intervention-audios', true);

-- Créer les politiques de sécurité pour le bucket intervention-audios
CREATE POLICY "Users can upload intervention audios" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'intervention-audios' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view intervention audios" ON storage.objects
FOR SELECT USING (bucket_id = 'intervention-audios');

CREATE POLICY "Users can update their intervention audios" ON storage.objects
FOR UPDATE USING (bucket_id = 'intervention-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their intervention audios" ON storage.objects
FOR DELETE USING (bucket_id = 'intervention-audios' AND auth.uid()::text = (storage.foldername(name))[1]);
