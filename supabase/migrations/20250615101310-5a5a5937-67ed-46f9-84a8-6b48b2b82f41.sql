
-- DIAGNOSTIC COMPLET V10 - Vérifier pourquoi les RDV "completed" ne sont pas visibles

-- 1. DÉSACTIVER TEMPORAIREMENT RLS pour voir TOUS les rendez-vous
SET row_security = off;

-- 2. Vérifier TOUS les rendez-vous de cet utilisateur, peu importe le statut
SELECT 
    id,
    professional_id,
    status,
    client_id,
    intervenant_id,
    start_time,
    end_time,
    created_at,
    'TOUS_LES_RDV_SANS_RLS' as diagnostic
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef'
ORDER BY created_at DESC;

-- 3. Compter les RDV par statut pour cet utilisateur
SELECT 
    status,
    COUNT(*) as count,
    'COMPTAGE_PAR_STATUT_SANS_RLS' as diagnostic
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef'
GROUP BY status
ORDER BY status;

-- 4. RÉACTIVER RLS
SET row_security = on;

-- 5. Tester la politique V9 avec RLS activé
SELECT 
    id,
    professional_id,
    status,
    client_id,
    intervenant_id,
    start_time,
    'AVEC_RLS_V9_ACTIVE' as diagnostic
FROM appointments 
WHERE professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef'
ORDER BY created_at DESC;

-- 6. Tester spécifiquement la fonction get_current_user_email pour cet utilisateur
SELECT 
    auth.uid() as current_user_id,
    public.get_current_user_email() as current_user_email,
    'TEST_FONCTION_EMAIL' as diagnostic;

-- 7. Vérifier si le problème vient des intervenants assignés aux RDV completed
SELECT 
    a.id,
    a.status,
    a.professional_id,
    a.intervenant_id,
    i.email as intervenant_email,
    i.first_name || ' ' || i.last_name as intervenant_name,
    'ANALYSE_INTERVENANTS_RDV_COMPLETED' as diagnostic
FROM appointments a
LEFT JOIN intervenants i ON a.intervenant_id = i.id
WHERE a.professional_id = 'ce140597-d5ed-444c-9fca-3573cbc20cef'
AND a.status = 'completed'
ORDER BY a.start_time DESC;
