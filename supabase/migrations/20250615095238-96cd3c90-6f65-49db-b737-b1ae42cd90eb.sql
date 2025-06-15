
-- Diagnostiquer les politiques RLS V6 pour les appointments
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
WHERE tablename = 'appointments' 
ORDER BY policyname;

-- Vérifier la fonction security definer
SELECT 
    proname,
    prosrc 
FROM pg_proc 
WHERE proname = 'get_current_user_email';

-- Test direct : voir tous les appointments de cet utilisateur sans RLS
SET row_security = off;
SELECT 
    id,
    professional_id,
    status,
    client_id,
    intervenant_id,
    start_time
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef';
SET row_security = on;
