-- Insérer des niveaux de base pour le jeu "La magie des mots"

-- Niveau 1 - Facile
INSERT INTO public.word_magic_levels (
  level_number,
  letters,
  grid_layout,
  solutions,
  bonus_words,
  difficulty
) VALUES (
  1,
  'T,E,R,R,E',
  '[
    [{"letter": "T", "x": 0, "y": 0}, {"letter": "E", "x": 1, "y": 0}, {"letter": "R", "x": 2, "y": 0}, {"letter": "R", "x": 3, "y": 0}, {"letter": "E", "x": 4, "y": 0}],
    [{"letter": "", "x": 0, "y": 1}, {"letter": "T", "x": 1, "y": 1}, {"letter": "", "x": 2, "y": 1}, {"letter": "", "x": 3, "y": 1}, {"letter": "", "x": 4, "y": 1}],
    [{"letter": "", "x": 0, "y": 2}, {"letter": "E", "x": 1, "y": 2}, {"letter": "", "x": 2, "y": 2}, {"letter": "", "x": 3, "y": 2}, {"letter": "", "x": 4, "y": 2}]
  ]'::jsonb,
  '["TERRE", "ET", "TE"]'::jsonb,
  '["TER", "ERE"]'::jsonb,
  'facile'
);

-- Niveau 2 - Facile
INSERT INTO public.word_magic_levels (
  level_number,
  letters,
  grid_layout,
  solutions,
  bonus_words,
  difficulty
) VALUES (
  2,
  'M,A,I,S,O,N',
  '[
    [{"letter": "M", "x": 0, "y": 0}, {"letter": "A", "x": 1, "y": 0}, {"letter": "I", "x": 2, "y": 0}, {"letter": "S", "x": 3, "y": 0}, {"letter": "O", "x": 4, "y": 0}, {"letter": "N", "x": 5, "y": 0}],
    [{"letter": "", "x": 0, "y": 1}, {"letter": "M", "x": 1, "y": 1}, {"letter": "I", "x": 2, "y": 1}, {"letter": "", "x": 3, "y": 1}, {"letter": "", "x": 4, "y": 1}, {"letter": "", "x": 5, "y": 1}],
    [{"letter": "", "x": 0, "y": 2}, {"letter": "A", "x": 1, "y": 2}, {"letter": "", "x": 2, "y": 2}, {"letter": "O", "x": 3, "y": 2}, {"letter": "N", "x": 4, "y": 2}, {"letter": "", "x": 5, "y": 2}]
  ]'::jsonb,
  '["MAISON", "MI", "AMI", "SON", "ON"]'::jsonb,
  '["MAIN", "SOIN", "MOIS"]'::jsonb,
  'facile'
);

-- Niveau 3 - Moyen
INSERT INTO public.word_magic_levels (
  level_number,
  letters,
  grid_layout,
  solutions,
  bonus_words,
  difficulty
) VALUES (
  3,
  'F,L,E,U,R,S',
  '[
    [{"letter": "F", "x": 0, "y": 0}, {"letter": "L", "x": 1, "y": 0}, {"letter": "E", "x": 2, "y": 0}, {"letter": "U", "x": 3, "y": 0}, {"letter": "R", "x": 4, "y": 0}, {"letter": "S", "x": 5, "y": 0}],
    [{"letter": "", "x": 0, "y": 1}, {"letter": "E", "x": 1, "y": 1}, {"letter": "U", "x": 2, "y": 1}, {"letter": "", "x": 3, "y": 1}, {"letter": "", "x": 4, "y": 1}, {"letter": "", "x": 5, "y": 1}],
    [{"letter": "F", "x": 0, "y": 2}, {"letter": "L", "x": 1, "y": 2}, {"letter": "", "x": 2, "y": 2}, {"letter": "R", "x": 3, "y": 2}, {"letter": "S", "x": 4, "y": 2}, {"letter": "", "x": 5, "y": 2}]
  ]'::jsonb,
  '["FLEURS", "FEU", "LEU", "SUR", "RS"]'::jsonb,
  '["FLEUR", "FUSE", "RUSE", "LEUR"]'::jsonb,
  'moyen'
);

-- Niveau 4 - Moyen
INSERT INTO public.word_magic_levels (
  level_number,
  letters,
  grid_layout,
  solutions,
  bonus_words,
  difficulty
) VALUES (
  4,
  'J,A,R,D,I,N',
  '[
    [{"letter": "J", "x": 0, "y": 0}, {"letter": "A", "x": 1, "y": 0}, {"letter": "R", "x": 2, "y": 0}, {"letter": "D", "x": 3, "y": 0}, {"letter": "I", "x": 4, "y": 0}, {"letter": "N", "x": 5, "y": 0}],
    [{"letter": "", "x": 0, "y": 1}, {"letter": "R", "x": 1, "y": 1}, {"letter": "A", "x": 2, "y": 1}, {"letter": "I", "x": 3, "y": 1}, {"letter": "D", "x": 4, "y": 1}, {"letter": "", "x": 5, "y": 1}],
    [{"letter": "", "x": 0, "y": 2}, {"letter": "", "x": 1, "y": 2}, {"letter": "N", "x": 2, "y": 2}, {"letter": "", "x": 3, "y": 2}, {"letter": "", "x": 4, "y": 2}, {"letter": "", "x": 5, "y": 2}]
  ]'::jsonb,
  '["JARDIN", "RAID", "AIR", "AN", "IN"]'::jsonb,
  '["DRAIN", "RADIN", "DINAR"]'::jsonb,
  'moyen'
);

-- Niveau 5 - Difficile
INSERT INTO public.word_magic_levels (
  level_number,
  letters,
  grid_layout,
  solutions,
  bonus_words,
  difficulty
) VALUES (
  5,
  'P,A,P,I,L,L,O,N',
  '[
    [{"letter": "P", "x": 0, "y": 0}, {"letter": "A", "x": 1, "y": 0}, {"letter": "P", "x": 2, "y": 0}, {"letter": "I", "x": 3, "y": 0}, {"letter": "L", "x": 4, "y": 0}, {"letter": "L", "x": 5, "y": 0}, {"letter": "O", "x": 6, "y": 0}, {"letter": "N", "x": 7, "y": 0}],
    [{"letter": "", "x": 0, "y": 1}, {"letter": "L", "x": 1, "y": 1}, {"letter": "I", "x": 2, "y": 1}, {"letter": "", "x": 3, "y": 1}, {"letter": "O", "x": 4, "y": 1}, {"letter": "N", "x": 5, "y": 1}, {"letter": "", "x": 6, "y": 1}, {"letter": "", "x": 7, "y": 1}],
    [{"letter": "P", "x": 0, "y": 2}, {"letter": "A", "x": 1, "y": 2}, {"letter": "", "x": 2, "y": 2}, {"letter": "", "x": 3, "y": 2}, {"letter": "L", "x": 4, "y": 2}, {"letter": "", "x": 5, "y": 2}, {"letter": "", "x": 6, "y": 2}, {"letter": "", "x": 7, "y": 2}]
  ]'::jsonb,
  '["PAPILLON", "LOI", "PIL", "LON", "ON", "PA", "AL"]'::jsonb,
  '["ILLON", "PION", "LION", "POIL", "POLO"]'::jsonb,
  'difficile'
);