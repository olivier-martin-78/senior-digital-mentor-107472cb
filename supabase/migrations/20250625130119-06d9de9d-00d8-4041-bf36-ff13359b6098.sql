
-- Permettre l'accès public en lecture aux plans d'abonnement actifs
CREATE POLICY "Public can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);
