
-- Créer la table activities pour stocker les activités
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter une contrainte pour valider les types d'activités
ALTER TABLE public.activities 
ADD CONSTRAINT valid_activity_type 
CHECK (activity_type IN ('meditation', 'games', 'gratitude', 'connection', 'exercises', 'compassion', 'reading', 'writing'));

-- Activer RLS pour la sécurité
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à tous les utilisateurs connectés de voir les activités
CREATE POLICY "Authenticated users can view activities" 
  ON public.activities 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Politique pour permettre aux admins de créer des activités
CREATE POLICY "Admins can create activities" 
  ON public.activities 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.is_admin());

-- Politique pour permettre aux admins de modifier des activités
CREATE POLICY "Admins can update activities" 
  ON public.activities 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin());

-- Politique pour permettre aux admins de supprimer des activités
CREATE POLICY "Admins can delete activities" 
  ON public.activities 
  FOR DELETE 
  TO authenticated
  USING (public.is_admin());
