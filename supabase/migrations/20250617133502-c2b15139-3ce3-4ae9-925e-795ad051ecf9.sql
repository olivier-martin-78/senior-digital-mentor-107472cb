
-- Créer la table des plans d'abonnement
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT UNIQUE,
  price_amount INTEGER NOT NULL, -- Prix en centimes (490 pour 4.90€)
  currency TEXT NOT NULL DEFAULT 'eur',
  billing_interval TEXT NOT NULL DEFAULT 'month',
  trial_period_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Créer la table des abonnements utilisateurs
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive', -- inactive, trialing, active, canceled, past_due, unpaid
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id) -- Un utilisateur ne peut avoir qu'un seul abonnement actif
);

-- Activer RLS sur les tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour subscription_plans (lecture publique)
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Politiques RLS pour user_subscriptions
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Insérer les plans d'abonnement
INSERT INTO public.subscription_plans (name, price_amount, trial_period_days, features) VALUES 
  (
    'Senior', 
    490, 
    15, 
    '["Journal intime", "Blog", "Albums photo", "Récits de vie", "Souhaits", "Activités bien-être"]'::jsonb
  ),
  (
    'Professionnel', 
    690, 
    65, 
    '["Toutes les fonctionnalités Senior", "Planificateur professionnel", "Gestion des clients", "Comptes-rendus intervention", "Facturation"]'::jsonb
  );

-- Fonction pour vérifier si un utilisateur a un abonnement actif
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE user_id = user_id_param 
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

-- Fonction pour obtenir le plan d'abonnement actuel d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_subscription_plan(user_id_param UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT sp.name 
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.subscription_plan_id = sp.id
  WHERE us.user_id = user_id_param 
  AND us.status IN ('active', 'trialing')
  AND (us.current_period_end IS NULL OR us.current_period_end > now())
  LIMIT 1;
$$;
