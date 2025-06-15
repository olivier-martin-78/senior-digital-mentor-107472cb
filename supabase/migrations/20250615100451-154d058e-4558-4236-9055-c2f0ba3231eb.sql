
-- DIAGNOSTIC APPROFONDI : Vérifier l'état exact des rendez-vous de mtresor2008@gmail.com
-- Désactiver temporairement RLS pour voir TOUS les rendez-vous
SET row_security = off;

-- 1. Voir TOUS les rendez-vous créés par cet utilisateur
SELECT 
    id,
    professional_id,
    status,
    client_id,
    intervenant_id,
    start_time,
    created_at,
    updated_at,
    'TOUS_LES_RDV_CREES_PAR_USER' as type_requete
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef'
ORDER BY start_time DESC;

-- 2. Vérifier les emails des intervenants associés
SELECT 
    a.id as appointment_id,
    a.status,
    a.professional_id,
    a.intervenant_id,
    i.email as intervenant_email,
    i.first_name || ' ' || i.last_name as intervenant_name,
    'DETAILS_INTERVENANTS' as type_requete
FROM appointments a
LEFT JOIN intervenants i ON a.intervenant_id = i.id
WHERE a.professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef'
ORDER BY a.start_time DESC;

-- 3. Tester les politiques RLS avec l'utilisateur spécifique
SELECT 
    id,
    professional_id,
    status,
    intervenant_id,
    start_time,
    CASE 
        WHEN professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef' THEN 'CREATEUR_OK'
        ELSE 'PAS_CREATEUR'
    END as test_createur,
    'TEST_POLITIQUES_RLS' as type_requete
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef';

-- Réactiver RLS
SET row_security = on;

-- 4. Test avec RLS activé - ce que voit réellement l'utilisateur
SELECT 
    id,
    professional_id,
    status,
    start_time,
    'AVEC_RLS_ACTIVE' as type_requete
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef';

-- 5. Vérifier les politiques actuellement actives
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'appointments' 
AND policyname LIKE '%v7%'
ORDER BY policyname;
