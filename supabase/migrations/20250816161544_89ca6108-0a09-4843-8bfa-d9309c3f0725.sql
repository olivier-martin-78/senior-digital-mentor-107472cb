-- Supprimer toutes les politiques récursives
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;  
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Créer une fonction security definer pour vérifier le rôle admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'::public.app_role
  );
$$;

-- Créer des politiques non-récursives utilisant la fonction
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles using function" 
ON public.user_roles 
FOR SELECT 
USING (public.current_user_is_admin());

CREATE POLICY "Admins can manage all roles using function" 
ON public.user_roles 
FOR ALL 
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());