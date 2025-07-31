import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Json } from '@/integrations/supabase/types';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_amount: number;
  currency: string;
  billing_interval: string;
  trial_period_days: number;
  features: Json;
  is_active: boolean;
}

const PublicSubscription = () => {
  console.log('PublicSubscription component rendering');
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log('Fetching subscription plans...');
        // Import Supabase dynamically to avoid authentication issues
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_amount', { ascending: true });

        if (error) {
          console.error('Error fetching plans:', error);
          setError('Impossible de charger les plans d\'abonnement');
          return;
        }
        
        console.log('Plans fetched successfully:', data);
        setPlans(data || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setError('Erreur de connexion');
        // Set fallback plans if database access fails
        setPlans([
          {
            id: 'fallback-senior',
            name: 'Senior',
            price_amount: 1990,
            currency: 'eur',
            billing_interval: 'month',
            trial_period_days: 7,
            features: [
              'Accès complet aux fonctionnalités',
              'Journal personnel illimité',
              'Récits de vie interactifs',
              'Support prioritaire'
            ],
            is_active: true
          },
          {
            id: 'fallback-professionnel',
            name: 'Professionnel',
            price_amount: 4990,
            currency: 'eur',
            billing_interval: 'month',
            trial_period_days: 14,
            features: [
              'Toutes les fonctionnalités Senior',
              'Gestion des interventions',
              'Rapports détaillés',
              'Outils de planification',
              'Support dédié'
            ],
            is_active: true
          }
        ]);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'senior':
        return <Star className="w-6 h-6 text-yellow-500" />;
      case 'professionnel':
        return <Crown className="w-6 h-6 text-purple-500" />;
      default:
        return <Sparkles className="w-6 h-6 text-blue-500" />;
    }
  };

  const getPlanFeatures = (features: Json): string[] => {
    if (Array.isArray(features)) {
      return features.filter((feature): feature is string => typeof feature === 'string');
    }
    return [];
  };

  const handleChoosePlan = () => {
    navigate('/auth');
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-tranches-charcoal mb-6">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-tranches-charcoal/70 max-w-2xl mx-auto mb-4">
            Découvrez toutes les fonctionnalités de CaprIA avec nos plans flexibles.
          </p>
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-green-800 font-semibold text-lg">
              Ces plans sont gratuits pour les 1000 premiers inscrits
            </p>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg max-w-md mx-auto">
              <div className="flex items-center justify-center text-orange-600 mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Information</span>
              </div>
              <p className="text-sm text-orange-700">
                Les plans ci-dessous sont affichés à titre indicatif
              </p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
            <p className="text-blue-700 text-sm">
              Connectez-vous ou créez un compte pour souscrire à un plan d'abonnement
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className="relative overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl font-serif text-tranches-charcoal">
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold text-tranches-dustyblue">
                  {formatPrice(plan.price_amount, plan.currency)}
                  <span className="text-sm font-normal text-gray-500">
                    /{plan.billing_interval === 'month' ? 'mois' : 'an'}
                  </span>
                </div>
                {plan.trial_period_days > 0 && (
                  <Badge variant="outline" className="mt-2 bg-yellow-400 border-yellow-400 text-black">
                    {plan.trial_period_days} jours d'essai gratuit
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {getPlanFeatures(plan.features).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-tranches-charcoal/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  <Button
                    className="w-full bg-tranches-dustyblue hover:bg-tranches-dustyblue/90 text-white"
                    onClick={handleChoosePlan}
                  >
                    Choisir ce plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-tranches-charcoal mb-4">
                Prêt à commencer ?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Créez votre compte pour accéder à toutes les fonctionnalités de CaprIA
              </p>
              <Button
                className="bg-tranches-sage hover:bg-tranches-sage/90 text-white"
                onClick={() => navigate('/auth')}
              >
                Créer un compte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicSubscription;
