-- Add game_type column to distinguish between cognitive puzzle and object assembly scenarios
ALTER TABLE cognitive_puzzle_scenarios 
ADD COLUMN game_type text NOT NULL DEFAULT 'cognitive-puzzle';

-- Update existing scenarios with appropriate game types
-- Original cognitive puzzle scenarios (home and city)
UPDATE cognitive_puzzle_scenarios 
SET game_type = 'cognitive-puzzle' 
WHERE name IN ('Une journée à la maison', 'Sortie en ville');

-- Object assembly scenarios (the new ones we added)
UPDATE cognitive_puzzle_scenarios 
SET game_type = 'object-assembly' 
WHERE name IN ('Relaxation Salon', 'Hygiène Salle de bain', 'Entretien Jardin', 'Organisation Chambre', 'Routine Cuisine');