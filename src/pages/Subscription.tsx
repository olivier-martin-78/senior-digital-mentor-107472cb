
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Sparkles, Clock, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import { useSubscription } from '@/hooks/useSubscription';
import { useAccountAccess } from '@/hooks/useAccountAccess';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
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

const Subscription = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { subscription, loading, createCheckout, checkSubscription } = useSubscription();
  const { accountStatus, freeTrialEnd, hasAccess } = useAccountAccess();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_amount', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Abonnement activé !',
        description: 'Votre abonnement a été activé avec succès.',
      });
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: 'Abonnement annulé',
        description: 'Vous avez annulé votre abonnement.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, checkSubscription]);

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

  const isCurrentPlan = (planName: string) => {
    return subscription?.subscription_plan === planName && subscription?.subscribed;
  };

  const getPlanFeatures = (features: Json): string[] => {
    if (Array.isArray(features)) {
      return features.filter((feature): feature is string => typeof feature === 'string');
    }
    return [];
  };

  const getTimeRemaining = () => {
    if (!freeTrialEnd) return null;
    const end = new Date(freeTrialEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
  };

  const timeRemaining = getTimeRemaining();

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
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
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-tranches-charcoal mb-6">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-tranches-charcoal/70 max-w-2xl mx-auto">
            Découvrez toutes les fonctionnalités de CaprIA avec nos plans flexibles
          </p>
          
          {/* Statut du compte */}
          {accountStatus === 'trial' && timeRemaining && (
            <Card className="max-w-md mx-auto mt-6 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center text-orange-600 mb-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Période d'essai gratuite</span>
                </div>
                <p className="text-sm text-orange-700">
                  Temps restant: {timeRemaining}
                </p>
              </CardContent>
            </Card>
          )}
          
          {!hasAccess && accountStatus === 'restricted' && (
            <Card className="max-w-md mx-auto mt-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center text-red-600 mb-2">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Accès expiré</span>
                </div>
                <p className="text-sm text-red-700">
                  Votre période d'essai a expiré. Choisissez un plan pour continuer.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                isCurrentPlan(plan.name) 
                  ? 'ring-2 ring-tranches-sage shadow-xl' 
                  : 'hover:shadow-lg'
              }`}
            >
              {isCurrentPlan(plan.name) && (
                <Badge className="absolute top-4 right-4 bg-tranches-sage text-white">
                  Plan actuel
                </Badge>
              )}
              
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
                  {isCurrentPlan(plan.name) ? (
                    <Button 
                      className="w-full bg-gray-100 text-gray-500 cursor-not-allowed" 
                      disabled
                    >
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-tranches-dustyblue hover:bg-tranches-dustyblue/90 text-white"
                      onClick={() => createCheckout(plan.id)}
                      disabled={loading}
                    >
                      {loading ? 'Chargement...' : 'Choisir ce plan'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {subscription?.subscribed && (
          <div className="text-center mt-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-tranches-charcoal mb-4">
                  Gérer votre abonnement
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Modifiez votre plan, mettez à jour votre méthode de paiement ou annulez votre abonnement.
                </p>
                <Button
                  variant="outline"
                  className="border-tranches-dustyblue text-tranches-dustyblue hover:bg-tranches-dustyblue/10"
                  onClick={() => window.open('https://billing.stripe.com/p/login/test_00000000000000', '_blank')}
                >
                  Gérer l'abonnement
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
