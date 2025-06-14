
-- Vérifier les politiques actuelles
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'appointments'
ORDER BY policyname;

-- Vérifier si RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'appointments';

-- Diagnostiquer pourquoi Bruno Pierre voit le RDV de jf-leseviller@orange.fr
-- Vérifier les professional_id des rendez-vous
SELECT 
    id,
    professional_id,
    intervenant_id,
    'c5bab1fc-1b7a-48d7-a78f-1927ac86b7c1' as bruno_user_id,
    CASE 
        WHEN professional_id = 'c5bab1fc-1b7a-48d7-a78f-1927ac86b7c1' THEN 'BRUNO_IS_CREATOR'
        ELSE 'BRUNO_NOT_CREATOR'
    END as creator_check
FROM public.appointments
WHERE id IN (
    'b1621207-c891-46c4-9d87-83fd4356c220',
    '70eb1c19-290b-4aa9-aabf-183f037e4a39', 
    '01abcde9-28a3-4f95-91ba-2909a2359600'
);
