-- Supprimer les politiques récursives défectueuses
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;  
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Créer des politiques simples et non-récursives
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);