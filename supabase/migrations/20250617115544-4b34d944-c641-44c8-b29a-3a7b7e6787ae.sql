
-- Activer RLS sur la table activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture des activités
-- Les utilisateurs peuvent voir leurs propres activités + les activités partagées globalement
CREATE POLICY "Users can view activities" ON public.activities
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR 
    shared_globally = true OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Politique pour permettre l'insertion d'activités
-- Les utilisateurs connectés peuvent créer des activités
CREATE POLICY "Users can create activities" ON public.activities
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
);

-- Politique pour permettre la modification d'activités
-- Les utilisateurs peuvent modifier leurs propres activités, les admins peuvent tout modifier
CREATE POLICY "Users can update their own activities" ON public.activities
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Politique pour permettre la suppression d'activités
-- Les utilisateurs peuvent supprimer leurs propres activités, les admins peuvent tout supprimer
CREATE POLICY "Users can delete their own activities" ON public.activities
FOR DELETE USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);
