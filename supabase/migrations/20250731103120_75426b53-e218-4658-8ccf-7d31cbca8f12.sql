UPDATE subscription_plans 
SET features = JSONB_BUILD_ARRAY(
  'Toutes les fonctionnalités Senior',
  'Planificateur professionnel', 
  'Gestion des clients, aide à la facturation',
  'Comptes-rendus intervention',
  'Création d''activités en autonomie (nécessite cet abonnement)'
)
WHERE name = 'Professionnel';