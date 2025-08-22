-- Corriger la position de l'Égouttoir pour l'aligner sur la même ligne que les autres objets
UPDATE cognitive_puzzle_spatial_slots 
SET x_position = 3, y_position = 0 
WHERE label = 'Égouttoir' 
  AND level_id IN (
    SELECT id FROM cognitive_puzzle_levels 
    WHERE scenario_id IN (
      SELECT id FROM cognitive_puzzle_scenarios 
      WHERE name = 'Routine Cuisine - Placement Spatial'
    )
  );