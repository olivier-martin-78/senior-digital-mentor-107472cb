-- Correction des positions spatiales pour être visibles sur la carte
-- Les positions doivent être en pourcentage entre 10% et 90% pour être visibles

-- Mettre à jour les positions pour le scénario "Journée type"
UPDATE cognitive_puzzle_spatial_slots 
SET x_position = 25, y_position = 30 
WHERE label = 'Cuisine';

UPDATE cognitive_puzzle_spatial_slots 
SET x_position = 75, y_position = 30 
WHERE label = 'Salle de bain';

UPDATE cognitive_puzzle_spatial_slots 
SET x_position = 50, y_position = 70 
WHERE label = 'Salon';

-- Ajouter une chambre pour le scénario maison
INSERT INTO cognitive_puzzle_spatial_slots (level_id, label, icon, x_position, y_position)
SELECT cpl.id, 'Chambre', '🛏️', 25, 70
FROM cognitive_puzzle_levels cpl
JOIN cognitive_puzzle_scenarios cps ON cpl.scenario_id = cps.id
WHERE cps.name = 'Journée type' AND cpl.level_number = 1;

-- Ajouter des lieux pour le scénario "Sortie en ville" si il existe
UPDATE cognitive_puzzle_spatial_slots 
SET x_position = CASE 
  WHEN label LIKE '%Pharmacie%' OR label LIKE '%pharmacie%' THEN 20
  WHEN label LIKE '%Boulangerie%' OR label LIKE '%boulangerie%' THEN 50  
  WHEN label LIKE '%Marché%' OR label LIKE '%marché%' THEN 80
  WHEN label LIKE '%Parc%' OR label LIKE '%parc%' THEN 35
  WHEN label LIKE '%Banque%' OR label LIKE '%banque%' THEN 65
  ELSE x_position
END,
y_position = CASE 
  WHEN label LIKE '%Pharmacie%' OR label LIKE '%pharmacie%' THEN 25
  WHEN label LIKE '%Boulangerie%' OR label LIKE '%boulangerie%' THEN 25  
  WHEN label LIKE '%Marché%' OR label LIKE '%marché%' THEN 25
  WHEN label LIKE '%Parc%' OR label LIKE '%parc%' THEN 65
  WHEN label LIKE '%Banque%' OR label LIKE '%banque%' THEN 65
  ELSE y_position
END
WHERE level_id IN (
  SELECT cpl.id FROM cognitive_puzzle_levels cpl
  JOIN cognitive_puzzle_scenarios cps ON cpl.scenario_id = cps.id
  WHERE cps.name = 'Sortie en ville'
);