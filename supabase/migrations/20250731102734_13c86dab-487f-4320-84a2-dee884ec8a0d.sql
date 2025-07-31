UPDATE subscription_plans 
SET features = JSONB_BUILD_ARRAY(
  'Journal intime',
  'Blog - Albums photo', 
  'Récits de vie',
  'Souhaits',
  'Activités cognitives, physiques et bien-être'
)
WHERE name = 'Senior';