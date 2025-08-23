-- Add display_order column to cognitive_puzzle_activities
ALTER TABLE public.cognitive_puzzle_activities 
ADD COLUMN display_order integer DEFAULT 0;

-- Update existing activities with current order based on created_at
UPDATE public.cognitive_puzzle_activities 
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY level_id ORDER BY created_at) as row_num
  FROM public.cognitive_puzzle_activities
) sub
WHERE public.cognitive_puzzle_activities.id = sub.id;

-- Add display_order column to cognitive_puzzle_time_slots
ALTER TABLE public.cognitive_puzzle_time_slots 
ADD COLUMN display_order integer DEFAULT 0;

-- Update existing time slots with current order based on created_at
UPDATE public.cognitive_puzzle_time_slots 
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY level_id ORDER BY created_at) as row_num
  FROM public.cognitive_puzzle_time_slots
) sub
WHERE public.cognitive_puzzle_time_slots.id = sub.id;