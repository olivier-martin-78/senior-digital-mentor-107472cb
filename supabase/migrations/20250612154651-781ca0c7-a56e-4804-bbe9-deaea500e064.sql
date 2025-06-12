
-- Ajouter une colonne pour la couleur du client
ALTER TABLE public.clients 
ADD COLUMN color VARCHAR(7) DEFAULT '#3174ad';

-- Ajouter une contrainte pour s'assurer que c'est un code couleur valide
ALTER TABLE public.clients 
ADD CONSTRAINT color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
