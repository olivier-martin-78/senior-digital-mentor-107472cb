-- Add audio_url field to activities table for blind test audio functionality
ALTER TABLE public.activities ADD COLUMN audio_url TEXT;

-- Update the table comment to reflect the new audio capability
COMMENT ON COLUMN public.activities.audio_url IS 'URL to audio file for blind test functionality when activity_type is music_quiz';