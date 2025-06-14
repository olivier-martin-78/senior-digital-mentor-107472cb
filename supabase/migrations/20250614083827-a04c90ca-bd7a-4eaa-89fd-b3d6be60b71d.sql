
-- Table pour gérer quels clients un utilisateur peut voir
CREATE TABLE public.user_client_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Table pour gérer quels intervenants un utilisateur peut voir
CREATE TABLE public.user_intervenant_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intervenant_id UUID NOT NULL REFERENCES public.intervenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, intervenant_id)
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.user_client_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_intervenant_permissions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_client_permissions
CREATE POLICY "Users can view their own client permissions" 
  ON public.user_client_permissions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own client permissions" 
  ON public.user_client_permissions 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Politiques RLS pour user_intervenant_permissions
CREATE POLICY "Users can view their own intervenant permissions" 
  ON public.user_intervenant_permissions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own intervenant permissions" 
  ON public.user_intervenant_permissions 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Fonction pour automatiquement donner accès aux clients quand un utilisateur devient intervenant
CREATE OR REPLACE FUNCTION public.grant_client_access_on_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Si un intervenant est assigné par email
  IF NEW.intervenant_id IS NOT NULL THEN
    -- Récupérer l'email de l'intervenant
    DECLARE
      intervenant_email TEXT;
      intervenant_user_id UUID;
    BEGIN
      SELECT email INTO intervenant_email
      FROM public.intervenants
      WHERE id = NEW.intervenant_id;
      
      -- Trouver l'utilisateur correspondant à cet email
      SELECT id INTO intervenant_user_id
      FROM auth.users
      WHERE email = intervenant_email;
      
      -- Si l'utilisateur existe, lui donner accès au client
      IF intervenant_user_id IS NOT NULL THEN
        INSERT INTO public.user_client_permissions (user_id, client_id)
        VALUES (intervenant_user_id, NEW.client_id)
        ON CONFLICT (user_id, client_id) DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER appointment_grant_client_access
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_client_access_on_appointment();

-- Fonction pour automatiquement donner accès aux intervenants créés
CREATE OR REPLACE FUNCTION public.grant_intervenant_access_on_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Donner automatiquement accès à l'intervenant créé par l'utilisateur
  INSERT INTO public.user_intervenant_permissions (user_id, intervenant_id)
  VALUES (NEW.created_by, NEW.id)
  ON CONFLICT (user_id, intervenant_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour les intervenants
CREATE TRIGGER intervenant_grant_access_on_creation
  AFTER INSERT ON public.intervenants
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_intervenant_access_on_creation();

-- Migrer les données existantes : donner accès aux intervenants déjà créés
INSERT INTO public.user_intervenant_permissions (user_id, intervenant_id)
SELECT created_by, id
FROM public.intervenants
ON CONFLICT (user_id, intervenant_id) DO NOTHING;

-- Migrer les données existantes : donner accès aux clients via les rendez-vous existants
INSERT INTO public.user_client_permissions (user_id, client_id)
SELECT DISTINCT 
  (SELECT id FROM auth.users WHERE email = i.email) as user_id,
  a.client_id
FROM public.appointments a
JOIN public.intervenants i ON a.intervenant_id = i.id
WHERE i.email IS NOT NULL
  AND (SELECT id FROM auth.users WHERE email = i.email) IS NOT NULL
ON CONFLICT (user_id, client_id) DO NOTHING;
