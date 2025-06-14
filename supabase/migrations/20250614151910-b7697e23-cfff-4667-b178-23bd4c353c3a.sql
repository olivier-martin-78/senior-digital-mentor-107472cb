
-- Testons d'abord la fonction de vérification email pour comprendre le problème
SELECT 
  a.id as appointment_id,
  a.professional_id,
  a.intervenant_id,
  i.email as intervenant_email,
  au.email as current_user_email,
  public.check_intervenant_email_match(a.intervenant_id) as email_match_result
FROM public.appointments a
LEFT JOIN public.intervenants i ON a.intervenant_id = i.id
LEFT JOIN auth.users au ON au.email = 'olivier.fernandez15@sfr.fr'
WHERE a.intervenant_id IS NOT NULL;

-- Vérifions aussi quels utilisateurs existent avec ces emails
SELECT id, email FROM auth.users 
WHERE email IN ('olivier.fernandez@sf-group.com', 'olivier.fernandez15@sfr.fr');

-- Et vérifions les intervenants
SELECT id, email, first_name, last_name FROM public.intervenants 
WHERE email IN ('olivier.fernandez@sf-group.com', 'olivier.fernandez15@sfr.fr');
