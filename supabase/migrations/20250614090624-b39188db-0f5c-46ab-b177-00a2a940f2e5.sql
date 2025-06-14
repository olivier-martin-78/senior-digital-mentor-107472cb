
-- Supprimer temporairement toutes les politiques RLS sur la table appointments
DROP POLICY IF EXISTS "Professionnels peuvent voir leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Intervenants peuvent voir leurs rendez-vous assignés" ON public.appointments;
DROP POLICY IF EXISTS "Accès via permissions clients" ON public.appointments;

-- Désactiver RLS sur la table appointments pour test
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Supprimer temporairement toutes les politiques RLS sur la table intervention_reports
DROP POLICY IF EXISTS "Professionnels peuvent voir leurs rapports" ON public.intervention_reports;
DROP POLICY IF EXISTS "Professionnels peuvent créer leurs rapports" ON public.intervention_reports;
DROP POLICY IF EXISTS "Professionnels peuvent modifier leurs rapports" ON public.intervention_reports;

-- Désactiver RLS sur la table intervention_reports pour test
ALTER TABLE public.intervention_reports DISABLE ROW LEVEL SECURITY;
