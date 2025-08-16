-- Nettoyer toutes les politiques existantes pour user_roles
DROP POLICY IF EXISTS "user_roles_delete_v2" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_v2" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_v2" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_v2" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles and admins can view all" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- Créer des politiques simples et claires pour user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    LIMIT 1
  )
);

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    LIMIT 1
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    LIMIT 1
  )
);