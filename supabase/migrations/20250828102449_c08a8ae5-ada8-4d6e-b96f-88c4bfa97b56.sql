-- Create storage bucket for emotion images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('emotion-images', 'emotion-images', true);

-- Create storage policies for emotion images
CREATE POLICY "Authenticated users can view emotion images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'emotion-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can upload emotion images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'emotion-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update emotion images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'emotion-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete emotion images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'emotion-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);