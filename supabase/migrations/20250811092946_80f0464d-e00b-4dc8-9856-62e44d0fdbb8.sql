-- Add media_type column to mini_site_media table to support videos
ALTER TABLE public.mini_site_media 
ADD COLUMN media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video'));