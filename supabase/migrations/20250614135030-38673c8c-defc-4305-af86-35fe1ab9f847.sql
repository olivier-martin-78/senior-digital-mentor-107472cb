
-- Activer Row Level Security sur la table appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Vérifier que nos politiques sont bien appliquées
-- (Les politiques existent déjà, on active juste RLS)
