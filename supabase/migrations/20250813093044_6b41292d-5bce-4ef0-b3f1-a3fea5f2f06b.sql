-- Ajouter une politique pour permettre aux administrateurs de mettre à jour tous les profils
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE 
TO public
USING (is_admin());