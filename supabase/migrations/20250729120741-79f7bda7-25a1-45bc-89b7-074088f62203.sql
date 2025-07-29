-- Corriger la politique RLS pour permettre aux admins de gérer les rôles de tous les utilisateurs
DROP POLICY IF EXISTS "user_roles_final" ON public.user_roles;

-- Nouvelle politique pour la lecture
CREATE POLICY "user_roles_read" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  -- Les utilisateurs peuvent voir leurs propres rôles
  user_id = auth.uid() 
  OR 
  -- Les admins peuvent voir tous les rôles
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Nouvelle politique pour l'insertion
CREATE POLICY "user_roles_insert" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Seuls les admins peuvent insérer des rôles
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Nouvelle politique pour la mise à jour
CREATE POLICY "user_roles_update" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (
  -- Seuls les admins peuvent modifier des rôles
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Nouvelle politique pour la suppression
CREATE POLICY "user_roles_delete" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (
  -- Seuls les admins peuvent supprimer des rôles
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);