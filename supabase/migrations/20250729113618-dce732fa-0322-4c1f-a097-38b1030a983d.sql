-- Ajouter le nouveau rôle 'createur_activite' à l'enum app_role
ALTER TYPE public.app_role ADD VALUE 'createur_activite';

-- Créer une fonction pour vérifier si un utilisateur peut créer des activités
CREATE OR REPLACE FUNCTION public.can_create_activities(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT 
    -- Vérifier si l'utilisateur a un abonnement "Professionnel" actif
    EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      JOIN public.subscription_plans sp ON us.subscription_plan_id = sp.id
      WHERE us.user_id = user_id_param 
      AND us.status IN ('active', 'trialing')
      AND (us.current_period_end IS NULL OR us.current_period_end > now())
      AND sp.name = 'Professionnel'
    )
    OR
    -- Vérifier si l'utilisateur a le rôle 'createur_activite'
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = user_id_param 
      AND role = 'createur_activite'
    )
    OR
    -- Vérifier si l'utilisateur est admin
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = user_id_param 
      AND role = 'admin'
    );
$function$;

-- Mettre à jour les politiques RLS pour la table activities
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities" 
ON public.activities 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) 
  AND (created_by = auth.uid()) 
  AND (
    public.can_create_activities(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Mettre à jour les politiques RLS pour la table activity_sub_tags
DROP POLICY IF EXISTS "Authenticated users can access activity sub tags" ON public.activity_sub_tags;
CREATE POLICY "Users can create activity sub tags" 
ON public.activity_sub_tags 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) 
  AND (created_by = auth.uid()) 
  AND (
    public.can_create_activities(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Users can view activity sub tags" 
ON public.activity_sub_tags 
FOR SELECT 
USING (auth.uid() IS NOT NULL);