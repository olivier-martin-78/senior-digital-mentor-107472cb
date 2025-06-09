
-- Supprimer toutes les politiques RLS existantes sur la table activities
DROP POLICY IF EXISTS "Authenticated users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can create activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can update activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can delete activities" ON public.activities;

-- Désactiver RLS sur la table activities
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
