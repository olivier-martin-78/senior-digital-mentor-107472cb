-- Mettre à jour les politiques RLS pour word_magic_levels
-- Permettre aux admins de gérer les niveaux (CREATE, UPDATE, DELETE)

-- Politique pour permettre aux admins de créer des niveaux
CREATE POLICY "Admins can create word magic levels" 
ON public.word_magic_levels 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Politique pour permettre aux admins de modifier des niveaux
CREATE POLICY "Admins can update word magic levels" 
ON public.word_magic_levels 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Politique pour permettre aux admins de supprimer des niveaux
CREATE POLICY "Admins can delete word magic levels" 
ON public.word_magic_levels 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Politique pour permettre à tous les utilisateurs authentifiés de voir les niveaux
CREATE POLICY "Authenticated users can view word magic levels" 
ON public.word_magic_levels 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Activer RLS sur la table
ALTER TABLE public.word_magic_levels ENABLE ROW LEVEL SECURITY;