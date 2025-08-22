-- Add display_order field to spatial_slots table for custom ordering
ALTER TABLE public.spatial_slots 
ADD COLUMN display_order INTEGER;

-- Initialize display_order based on current id order for each level
UPDATE public.spatial_slots 
SET display_order = subquery.row_number
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY level_id ORDER BY id) as row_number
  FROM public.spatial_slots
) subquery
WHERE public.spatial_slots.id = subquery.id;

-- Set default value for future inserts
ALTER TABLE public.spatial_slots 
ALTER COLUMN display_order SET DEFAULT 1;

-- Add index for better performance on ordering queries
CREATE INDEX idx_spatial_slots_display_order ON public.spatial_slots(level_id, display_order);