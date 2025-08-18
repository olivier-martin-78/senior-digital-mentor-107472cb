-- Corriger le thumbnail du scénario existant et ajouter les données manquantes

-- Mise à jour du scénario "Journée type" pour corriger le thumbnail
UPDATE cognitive_puzzle_scenarios 
SET thumbnail = '🏠'
WHERE name = 'Journée type';

-- Ajouter les niveaux manquants pour "Journée type"
INSERT INTO cognitive_puzzle_levels (scenario_id, level_number, name, description, enable_timeline, spatial_required, temporal_required)
VALUES 
(
  (SELECT id FROM cognitive_puzzle_scenarios WHERE name = 'Journée type'),
  2,
  'Après-midi actif', 
  'Organisez vos activités de l''après-midi en tenant compte des contraintes.',
  true,
  3,
  2
),
(
  (SELECT id FROM cognitive_puzzle_scenarios WHERE name = 'Journée type'),
  3,
  'Soirée détente',
  'Terminez votre journée avec des activités relaxantes bien organisées.',
  true,
  2,
  3
);

-- Créer le scénario "Sortie en ville" avec ses 3 niveaux
INSERT INTO cognitive_puzzle_scenarios (name, description, thumbnail)
VALUES ('Sortie en ville', 'Planifiez votre sortie en ville en organisant vos déplacements et activités de manière optimale.', '🏙️');

-- Ajouter les 3 niveaux pour "Sortie en ville"
INSERT INTO cognitive_puzzle_levels (scenario_id, level_number, name, description, enable_timeline, spatial_required, temporal_required)
VALUES 
(
  (SELECT id FROM cognitive_puzzle_scenarios WHERE name = 'Sortie en ville'),
  1,
  'Préparatifs',
  'Préparez votre sortie en organisant les éléments essentiels.',
  false,
  2,
  1
),
(
  (SELECT id FROM cognitive_puzzle_scenarios WHERE name = 'Sortie en ville'),
  2,
  'En déplacement',
  'Naviguez en ville en optimisant vos trajets et timing.',
  true,
  3,
  3
),
(
  (SELECT id FROM cognitive_puzzle_scenarios WHERE name = 'Sortie en ville'),
  3,
  'Retour à la maison',
  'Organisez votre retour et les activités de fin de sortie.',
  true,
  2,
  2
);