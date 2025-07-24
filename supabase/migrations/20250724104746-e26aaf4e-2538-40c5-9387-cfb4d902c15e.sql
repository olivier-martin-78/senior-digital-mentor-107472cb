-- Create storage bucket for spot differences game images
INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-differences-images', 'spot-differences-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for spot differences images
CREATE POLICY "Spot differences images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'spot-differences-images');

CREATE POLICY "Authenticated users can upload spot differences images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'spot-differences-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own spot differences images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'spot-differences-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own spot differences images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'spot-differences-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);