-- Add display_order column to cognitive_puzzle_spatial_slots table for admin drag & drop functionality
ALTER TABLE public.cognitive_puzzle_spatial_slots 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing records with display_order based on their current order (by id for consistency)
UPDATE public.cognitive_puzzle_spatial_slots 
SET display_order = sub.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY level_id ORDER BY id) as row_number
  FROM public.cognitive_puzzle_spatial_slots
) sub
WHERE public.cognitive_puzzle_spatial_slots.id = sub.id;

-- Create an index for better performance when ordering
CREATE INDEX idx_cognitive_puzzle_spatial_slots_display_order 
ON public.cognitive_puzzle_spatial_slots(level_id, display_order);