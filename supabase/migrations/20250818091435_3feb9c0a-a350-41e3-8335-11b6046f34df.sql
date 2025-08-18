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

-- Ajouter quelques activités de base si elles n'existent pas
INSERT INTO cognitive_puzzle_activities (name, icon, category, description)
VALUES 
('Se lever', '🛏️', 'activity', 'Sortir du lit et commencer la journée'),
('Petit déjeuner', '☕', 'activity', 'Prendre le petit déjeuner'),
('Se laver', '🚿', 'activity', 'Faire sa toilette matinale'),
('S''habiller', '👕', 'activity', 'Mettre ses vêtements'),
('Déjeuner', '🍽️', 'activity', 'Prendre le repas de midi'),
('Faire les courses', '🛒', 'activity', 'Acheter les provisions'),
('Prendre les transports', '🚌', 'activity', 'Utiliser les transports en commun'),
('Rendez-vous médical', '🏥', 'activity', 'Consulter un médecin'),
('Dîner', '🍽️', 'activity', 'Prendre le repas du soir'),
('Se coucher', '😴', 'activity', 'Aller au lit'),
('Appel inattendu', '📞', 'twist', 'Recevoir un appel important'),
('Pluie', '🌧️', 'twist', 'Il se met à pleuvoir'),
('Embouteillage', '🚗', 'twist', 'Bouchons sur la route'),
('Visite surprise', '🚪', 'twist', 'Quelqu''un sonne à la porte')
ON CONFLICT (name) DO NOTHING;

-- Ajouter des créneaux temporels de base
INSERT INTO cognitive_puzzle_time_slots (label, icon, period, order_index)
VALUES 
('Matin tôt', '🌅', 'morning', 1),
('Matin', '☀️', 'morning', 2),
('Fin de matinée', '🕚', 'morning', 3),
('Midi', '☀️', 'noon', 4),
('Début d''après-midi', '🕐', 'afternoon', 5),
('Après-midi', '☀️', 'afternoon', 6),
('Fin d''après-midi', '🌇', 'afternoon', 7),
('Soirée', '🌆', 'evening', 8),
('Nuit', '🌙', 'evening', 9)
ON CONFLICT (label) DO NOTHING;

-- Ajouter des emplacements spatiaux de base
INSERT INTO cognitive_puzzle_spatial_slots (label, icon, x, y, location_type)
VALUES 
('Chambre', '🛏️', 1, 1, 'home'),
('Salle de bain', '🚿', 2, 1, 'home'),
('Cuisine', '🍽️', 1, 2, 'home'),
('Salon', '🛋️', 2, 2, 'home'),
('Entrée', '🚪', 3, 2, 'home'),
('Magasin', '🏪', 1, 3, 'city'),
('Transport', '🚌', 2, 3, 'city'),
('Hôpital', '🏥', 3, 3, 'city'),
('Parc', '🌳', 1, 4, 'city'),
('Pharmacie', '💊', 2, 4, 'city')
ON CONFLICT (label) DO NOTHING;