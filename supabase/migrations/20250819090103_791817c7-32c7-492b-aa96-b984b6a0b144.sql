-- Add columns for spatial and temporal section titles to levels table
ALTER TABLE public.cognitive_puzzle_levels 
ADD COLUMN spatial_title TEXT DEFAULT 'Plan du quartier',
ADD COLUMN spatial_icon TEXT DEFAULT '🏙️', 
ADD COLUMN temporal_title TEXT DEFAULT 'Organiser votre temps',
ADD COLUMN temporal_icon TEXT DEFAULT '⏰';