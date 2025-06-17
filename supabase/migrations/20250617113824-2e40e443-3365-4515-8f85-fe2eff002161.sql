
-- Ajouter une colonne pour gérer le partage global des activités
ALTER TABLE public.activities 
ADD COLUMN shared_globally boolean DEFAULT false;

-- Ajouter un commentaire pour expliquer le champ
COMMENT ON COLUMN public.activities.shared_globally IS 'Permet de partager une activité avec tous les utilisateurs connectés';

-- Mettre à jour les activités existantes créées par olivier.martin.78000@gmail.com
-- pour qu'elles soient partagées globalement par défaut
UPDATE public.activities 
SET shared_globally = true
WHERE created_by IN (
  SELECT id FROM auth.users 
  WHERE email = 'olivier.martin.78000@gmail.com'
)
AND activity_type IN ('meditation', 'games', 'exercises');
