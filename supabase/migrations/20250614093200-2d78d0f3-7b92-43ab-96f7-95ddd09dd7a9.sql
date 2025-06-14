
-- Vérifier l'état actuel des politiques RLS sur la table appointments
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'appointments';

-- Vérifier les politiques existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'appointments';

-- Réactiver RLS sur la table appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Créer des politiques strictes pour les appointments
-- 1. Les professionnels peuvent voir les rendez-vous qu'ils ont créés
CREATE POLICY "Professionnels peuvent voir leurs rendez-vous créés" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = professional_id);

-- 2. Les intervenants peuvent voir les rendez-vous où ils sont assignés
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

-- 3. Politique pour les opérations INSERT, UPDATE, DELETE (seulement pour les créateurs)
CREATE POLICY "Professionnels peuvent modifier leurs rendez-vous" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionnels peuvent mettre à jour leurs rendez-vous" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = professional_id);

CREATE POLICY "Professionnels peuvent supprimer leurs rendez-vous" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = professional_id);

-- Réactiver RLS sur la table intervention_reports aussi
ALTER TABLE public.intervention_reports ENABLE ROW LEVEL SECURITY;

-- Politiques pour les rapports d'intervention
CREATE POLICY "Professionnels peuvent voir leurs rapports" 
ON public.intervention_reports 
FOR SELECT 
USING (auth.uid() = professional_id);

CREATE POLICY "Professionnels peuvent créer leurs rapports" 
ON public.intervention_reports 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionnels peuvent modifier leurs rapports" 
ON public.intervention_reports 
FOR UPDATE 
USING (auth.uid() = professional_id);

CREATE POLICY "Professionnels peuvent supprimer leurs rapports" 
ON public.intervention_reports 
FOR DELETE 
USING (auth.uid() = professional_id);
