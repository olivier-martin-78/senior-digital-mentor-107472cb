
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAccountAccess } from '@/hooks/useAccountAccess';

interface SubscriptionData {
  subscribed: boolean;
  subscription_plan: string | null;
  current_period_end: string | null;
  status: string;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const { updateAccountStatuses } = useAccountAccess();
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
        setSubscription({
          subscribed: false,
          subscription_plan: null,
          current_period_end: null,
          status: 'inactive'
        });
      } else {
        setSubscription(data);
        // Mettre à jour les statuts des comptes après vérification de l'abonnement
        await updateAccountStatuses();
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
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
        title: 'Service temporairement indisponible',
        description: 'Les paiements ne sont pas encore configurés. Contactez le support.',
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
      setLoading(true);
      console.log('Opening customer portal for user:', user?.email);
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Customer portal error:', error);
        throw error;
      }
      
      console.log('Customer portal response:', data);
      
      if (data?.url) {
        // Ouvrir le portail client Stripe dans un nouvel onglet
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL du portail client non reçue');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      
      // Gérer les différents types d'erreurs
      if (error?.context?.response?.error === 'stripe_portal_not_configured') {
        toast({
          title: 'Configuration requise',
          description: 'Le portail client Stripe doit être configuré. Veuillez contacter le support.',
          variant: 'destructive',
        });
      } else if (error?.context?.response?.message?.includes('No Stripe customer found')) {
        toast({
          title: 'Aucun abonnement trouvé',
          description: 'Aucun abonnement actif n\'a été trouvé pour votre compte. Veuillez vous abonner d\'abord.',
          variant: 'destructive',
        });
      } else {
        // Message d'erreur plus spécifique
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        
        toast({
          title: 'Erreur d\'accès au portail',
          description: `Impossible d'accéder à la gestion des abonnements: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
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
