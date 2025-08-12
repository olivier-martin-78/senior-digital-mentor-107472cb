-- Tighten RLS by removing overly permissive policies and adding scoped ones

-- 1) Drop dangerous "ALL USING true" policies
DROP POLICY IF EXISTS "Authenticated users can access activities" ON public.activities;
DROP POLICY IF EXISTS "Authenticated users can access blog albums" ON public.blog_albums;
DROP POLICY IF EXISTS "Authenticated users can access blog comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Authenticated users can access blog media" ON public.blog_media;
DROP POLICY IF EXISTS "Authenticated users can access life stories" ON public.life_stories;

-- 2) life_stories: add explicit INSERT/UPDATE/DELETE policies (keep existing SELECT policy)
CREATE POLICY "Life stories - insert own"
ON public.life_stories
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Life stories - update own or admin"
ON public.life_stories
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Life stories - delete own or admin"
ON public.life_stories
FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());

-- 3) blog_albums: add explicit INSERT/UPDATE/DELETE policies (keep existing SELECT policy)
CREATE POLICY "Blog albums - insert own"
ON public.blog_albums
FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Blog albums - update own or admin"
ON public.blog_albums
FOR UPDATE
USING (author_id = auth.uid() OR public.is_admin());

CREATE POLICY "Blog albums - delete own or admin"
ON public.blog_albums
FOR DELETE
USING (author_id = auth.uid() OR public.is_admin());

-- 4) Storage: make sensitive buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('life-story-audios', 'contact-attachments', 'intervention-audios');

-- 5) Storage RLS for private buckets (owner path: first folder == auth.uid())
-- life-story-audios
CREATE POLICY "Life story audios - owner or admin can read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'life-story-audios' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

CREATE POLICY "Life story audios - owner can insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'life-story-audios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Life story audios - owner or admin can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'life-story-audios' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- contact-attachments
CREATE POLICY "Contact attachments - owner or admin can read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contact-attachments' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

CREATE POLICY "Contact attachments - owner can insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contact-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Contact attachments - owner or admin can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contact-attachments' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- intervention-audios
CREATE POLICY "Intervention audios - owner or admin can read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'intervention-audios' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

CREATE POLICY "Intervention audios - owner can insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'intervention-audios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Intervention audios - owner or admin can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'intervention-audios' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);
