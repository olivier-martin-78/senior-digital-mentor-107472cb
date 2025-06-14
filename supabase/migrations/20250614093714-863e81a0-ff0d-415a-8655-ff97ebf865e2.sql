
-- Diagnostiquer le problème RLS
-- 1. Vérifier si RLS est bien activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'appointments';

-- 2. Lister toutes les politiques actuelles sur appointments
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'appointments'
ORDER BY policyname;

-- 3. Vérifier les données problématiques pour cet utilisateur spécifique
-- (Cela nous aidera à comprendre pourquoi il voit ces rendez-vous)
SELECT 
    a.id,
    a.professional_id,
    a.intervenant_id,
    i.email as intervenant_email,
    au.email as professional_email,
    'c5bab1fc-1b7a-48d7-a78f-1927ac86b7c1' as target_user_id
FROM public.appointments a
LEFT JOIN public.intervenants i ON a.intervenant_id = i.id
LEFT JOIN auth.users au ON a.professional_id = au.id
WHERE a.professional_id != 'c5bab1fc-1b7a-48d7-a78f-1927ac86b7c1'
ORDER BY a.created_at DESC;

-- 4. Supprimer toutes les anciennes politiques conflictuelles
DROP POLICY IF EXISTS "Professionnels peuvent voir leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Intervenants peuvent voir leurs rendez-vous assignés" ON public.appointments;
DROP POLICY IF EXISTS "Accès via permissions clients" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent voir leurs rendez-vous créés" ON public.appointments;
DROP POLICY IF EXISTS "Intervenants peuvent voir leurs rendez-vous assignés" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent modifier leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent mettre à jour leurs rendez-vous" ON public.appointments;
DROP POLICY IF EXISTS "Professionnels peuvent supprimer leurs rendez-vous" ON public.appointments;

-- 5. Créer des politiques plus strictes et claires
CREATE POLICY "strict_professional_access" 
ON public.appointments 
FOR ALL
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "strict_intervenant_access" 
ON public.appointments 
FOR SELECT
USING (
  intervenant_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- 6. Vérifier que RLS est bien activé
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
