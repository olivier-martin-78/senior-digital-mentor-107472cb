-- Supprimer l'ancienne politique admin générale
DROP POLICY IF EXISTS "Admins can manage all mini sites" ON public.mini_sites;

-- Créer des politiques spécifiques pour les admins
CREATE POLICY "Admins can view all mini sites" 
ON public.mini_sites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can insert mini sites" 
ON public.mini_sites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can update all mini sites" 
ON public.mini_sites 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete all mini sites" 
ON public.mini_sites 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);