-- Create storage bucket for audio memory game sounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-memory-sounds', 'audio-memory-sounds', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3']);

-- Create RLS policies for audio memory sounds bucket
CREATE POLICY "Admins can upload audio files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audio-memory-sounds' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update audio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'audio-memory-sounds' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete audio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audio-memory-sounds' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Anyone can download audio files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-memory-sounds');