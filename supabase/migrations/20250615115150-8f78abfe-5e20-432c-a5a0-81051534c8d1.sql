
-- Ajouter des politiques RLS pour la table user_client_permissions
CREATE POLICY "Users can view client permissions they are involved in"
  ON public.user_client_permissions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT created_by FROM public.clients WHERE id = client_id
    )
  );

CREATE POLICY "Only client creators can manage permissions"
  ON public.user_client_permissions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.clients WHERE id = client_id
    )
  );

CREATE POLICY "Only client creators can delete permissions"
  ON public.user_client_permissions
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT created_by FROM public.clients WHERE id = client_id
    )
  );

-- Ajouter des politiques RLS pour la table user_intervenant_permissions
CREATE POLICY "Users can view intervenant permissions they are involved in"
  ON public.user_intervenant_permissions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT created_by FROM public.intervenants WHERE id = intervenant_id
    )
  );

CREATE POLICY "Only intervenant creators can manage permissions"
  ON public.user_intervenant_permissions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.intervenants WHERE id = intervenant_id
    )
  );

CREATE POLICY "Only intervenant creators can delete permissions"
  ON public.user_intervenant_permissions
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT created_by FROM public.intervenants WHERE id = intervenant_id
    )
  );

-- Fonction pour vérifier si un client peut être supprimé
CREATE OR REPLACE FUNCTION public.can_delete_client(client_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE client_id = client_id_param
    AND status IN ('scheduled', 'completed')
  );
$$;

-- Fonction pour vérifier si un intervenant peut être supprimé
CREATE OR REPLACE FUNCTION public.can_delete_intervenant(intervenant_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE intervenant_id = intervenant_id_param
  );
$$;

-- Fonction pour récupérer les utilisateurs professionnels
CREATE OR REPLACE FUNCTION public.get_professional_users()
RETURNS TABLE(id uuid, display_name text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.display_name, p.email
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'professionnel'
  ORDER BY p.display_name;
$$;
