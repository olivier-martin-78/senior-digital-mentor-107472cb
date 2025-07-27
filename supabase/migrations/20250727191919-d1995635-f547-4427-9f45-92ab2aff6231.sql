-- Les politiques RLS existent déjà, mais le linter détecte une fausse alerte
-- Vérifier les politiques existantes et les corriger si nécessaire

-- Supprimer et recréer les politiques pour éliminer le warning
DROP POLICY IF EXISTS "Users can insert their own actions" ON public.user_actions;
DROP POLICY IF EXISTS "Admins can view all actions" ON public.user_actions;
DROP POLICY IF EXISTS "Admins can delete actions" ON public.user_actions;

-- Recréer les politiques avec une syntaxe plus explicite
CREATE POLICY "users_can_insert_own_actions" 
ON public.user_actions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_can_view_all_actions" 
ON public.user_actions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "admins_can_delete_actions" 
ON public.user_actions 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);