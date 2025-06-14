
-- Activer RLS sur la table appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux professionnels de voir leurs propres rendez-vous
CREATE POLICY "Professionnels peuvent voir leurs rendez-vous" 
ON public.appointments 
FOR SELECT 
USING (
  auth.uid() = professional_id
);

-- Politique pour permettre aux intervenants de voir les rendez-vous où ils sont assignés
CREATE POLICY "Intervenants peuvent voir leurs rendez-vous assignés" 
ON public.appointments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Politique pour permettre l'accès via les permissions client-utilisateur
CREATE POLICY "Accès via permissions clients" 
ON public.appointments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_client_permissions ucp
    WHERE ucp.client_id = appointments.client_id 
    AND ucp.user_id = auth.uid()
  )
);

-- Activer RLS sur la table intervention_reports
ALTER TABLE public.intervention_reports ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux professionnels de voir leurs propres rapports
CREATE POLICY "Professionnels peuvent voir leurs rapports" 
ON public.intervention_reports 
FOR SELECT 
USING (auth.uid() = professional_id);

-- Politique pour permettre aux professionnels de créer leurs rapports
CREATE POLICY "Professionnels peuvent créer leurs rapports" 
ON public.intervention_reports 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

-- Politique pour permettre aux professionnels de modifier leurs rapports
CREATE POLICY "Professionnels peuvent modifier leurs rapports" 
ON public.intervention_reports 
FOR UPDATE 
USING (auth.uid() = professional_id);
