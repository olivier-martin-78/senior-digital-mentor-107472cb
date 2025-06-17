
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_plan: string | null;
  current_period_end: string | null;
  status: string;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!session) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        // Ne pas afficher de toast d'erreur, juste logger l'erreur
        setSubscription({
          subscribed: false,
          subscription_plan: null,
          current_period_end: null,
          status: 'inactive'
        });
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Définir un état par défaut au lieu d'afficher un toast d'erreur
      setSubscription({
        subscribed: false,
        subscription_plan: null,
        current_period_end: null,
        status: 'inactive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (planId: string) => {
    if (!session) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour vous abonner',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      // Ouvrir Stripe Checkout dans un nouvel onglet
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la session de paiement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour gérer votre abonnement',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      // Ouvrir le portail client Stripe dans un nouvel onglet
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ouvrir le portail client',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user, session]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
