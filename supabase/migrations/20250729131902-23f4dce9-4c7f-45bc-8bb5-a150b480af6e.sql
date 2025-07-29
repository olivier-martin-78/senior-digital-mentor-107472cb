-- Activer l'accès permanent pour les utilisateurs mentionnés
UPDATE public.profiles 
SET permanent_access = true 
WHERE email IN (
  'pierrettefernandez27@gmail.com', 
  'olivier.fernandez15@sfr.fr', 
  'carolinafernandez.ecp@gmail.com', 
  'conceicao-18@hotmail.fr', 
  'olivier.fernandez.78@outlook.com'
);