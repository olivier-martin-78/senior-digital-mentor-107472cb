
-- Analyser plus en détail les intervenants et les emails
SELECT 
    i.id,
    i.first_name,
    i.last_name,
    i.email,
    i.created_by,
    'olivier.fernandez15@sfr.fr' as bruno_email,
    CASE 
        WHEN i.email = 'olivier.fernandez15@sfr.fr' THEN 'MATCH'
        ELSE 'NO_MATCH'
    END as email_check
FROM public.intervenants i
ORDER BY i.email;

-- Vérifier s'il y a des doublons d'intervenants avec le même email
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as intervenant_ids
FROM public.intervenants 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Analyser les rendez-vous que Bruno Pierre voit
SELECT 
    a.id,
    a.professional_id,
    a.intervenant_id,
    i.email as intervenant_email,
    CASE 
        WHEN a.professional_id = 'c5bab1fc-1b7a-48d7-a78f-1927ac86b7c1' THEN 'BRUNO_IS_CREATOR'
        ELSE 'BRUNO_NOT_CREATOR' 
    END as creator_check,
    CASE 
        WHEN i.email = 'olivier.fernandez15@sfr.fr' THEN 'EMAIL_MATCH'
        ELSE 'EMAIL_NO_MATCH'
    END as email_match_check
FROM public.appointments a
LEFT JOIN public.intervenants i ON a.intervenant_id = i.id
WHERE a.id IN (
    'b1621207-c891-46c4-9d87-83fd4356c220',
    '70eb1c19-290b-4aa9-aabf-183f037e4a39', 
    '01abcde9-28a3-4f95-91ba-2909a2359600'
)
ORDER BY a.id;
