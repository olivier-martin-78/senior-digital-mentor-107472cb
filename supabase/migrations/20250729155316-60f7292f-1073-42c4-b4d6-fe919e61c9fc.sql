-- Fix RLS policy gap on media table
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view media they have access to
CREATE POLICY "Authenticated users can view media" 
ON public.media 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert their own media
CREATE POLICY "Users can insert media" 
ON public.media 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own media (if needed)
CREATE POLICY "Users can update media" 
ON public.media 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete media (if needed)
CREATE POLICY "Users can delete media" 
ON public.media 
FOR DELETE 
USING (auth.uid() IS NOT NULL);