
-- =============================================================================
-- EXTENSION RLS: TABLES ACTIVITIES
-- =============================================================================
-- Application de RLS sur les tables d'activités avec politiques permissives

-- 📝 ACTIVER RLS SUR LES TABLES ACTIVITIES
-- -----------------------------------------------------------------------------

-- Table activities (activités génériques)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Table activity_sub_tags (sous-catégories d'activités)
ALTER TABLE public.activity_sub_tags ENABLE ROW LEVEL SECURITY;

-- 📝 CRÉER LES POLITIQUES PERMISSIVES POUR ACTIVITIES
-- -----------------------------------------------------------------------------
-- Ces politiques permettent l'accès à tous les utilisateurs authentifiés
-- La logique de filtrage fine reste côté application

-- Politiques pour activities
CREATE POLICY "Authenticated users can access activities" 
ON public.activities 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (created_by = auth.uid());

-- Politiques pour activity_sub_tags
CREATE POLICY "Authenticated users can access activity sub tags" 
ON public.activity_sub_tags 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (created_by = auth.uid());

-- =============================================================================
-- COMMANDES DE ROLLBACK (à utiliser en cas de problème)
-- =============================================================================

/*
-- ROLLBACK - À EXÉCUTER SI DES PROBLÈMES SONT DÉTECTÉS:

-- Désactiver RLS sur les tables activities
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_sub_tags DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques créées
DROP POLICY IF EXISTS "Authenticated users can access activities" ON public.activities;
DROP POLICY IF EXISTS "Authenticated users can access activity sub tags" ON public.activity_sub_tags;
*/
