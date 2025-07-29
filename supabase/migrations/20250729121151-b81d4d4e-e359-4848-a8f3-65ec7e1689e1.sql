-- Supprimer les politiques actuelles qui causent la récursion
DROP POLICY IF EXISTS "user_roles_read" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

-- Créer une fonction SECURITY DEFINER pour vérifier si l'utilisateur actuel est admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Nouvelles politiques RLS utilisant la fonction SECURITY DEFINER
CREATE POLICY "user_roles_read_v2" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  -- Les utilisateurs peuvent voir leurs propres rôles
  user_id = auth.uid() 
  OR 
  -- Les admins peuvent voir tous les rôles
  public.current_user_is_admin()
);

CREATE POLICY "user_roles_insert_v2" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Seuls les admins peuvent insérer des rôles
  public.current_user_is_admin()
);

CREATE POLICY "user_roles_update_v2" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (
  -- Seuls les admins peuvent modifier des rôles
  public.current_user_is_admin()
);

CREATE POLICY "user_roles_delete_v2" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (
  -- Seuls les admins peuvent supprimer des rôles
  public.current_user_is_admin()
);