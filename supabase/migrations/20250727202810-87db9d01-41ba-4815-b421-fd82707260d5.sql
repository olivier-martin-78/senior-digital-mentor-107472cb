-- Changer le type de la colonne content_id de UUID vers TEXT
-- pour permettre le tracking des activités intégrées qui n'ont pas d'UUID

ALTER TABLE public.user_actions 
ALTER COLUMN content_id TYPE TEXT;