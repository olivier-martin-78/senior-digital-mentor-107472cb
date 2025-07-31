UPDATE subscription_plans 
SET features = JSONB_BUILD_ARRAY(
  'Toutes les fonctionnalités Senior',
  'Planification de vos rendez-vous', 
  'Gestion des clients, aide à la facturation',
  'Comptes-rendus intervention',
  'Création d''activités en autonomie (nécessite cet abonnement)'
)
WHERE name = 'Professionnel';