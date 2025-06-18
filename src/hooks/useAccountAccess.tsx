
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AccountStatus {
  hasAccess: boolean;
  accountStatus: 'active' | 'trial' | 'expired' | 'restricted';
  freeTrialEnd?: string;
  isLoading: boolean;
}

export const useAccountAccess = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({
    hasAccess: true,
    accountStatus: 'active',
    isLoading: true,
  });

  const checkAccess = async () => {
    if (!user) {
      setAccountStatus({
        hasAccess: false,
        accountStatus: 'restricted',
        isLoading: false,
      });
      return;
    }

    try {
      // Vérifier l'accès via la fonction Supabase
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('user_has_app_access', { user_id_param: user.id });

      if (accessError) {
        console.error('Erreur lors de la vérification d\'accès:', accessError);
        throw accessError;
      }

      // Récupérer le profil avec les informations d'essai
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('account_status, free_trial_end')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }

      // Normaliser le statut du compte avec une valeur par défaut
      const normalizeAccountStatus = (status: string | null): 'active' | 'trial' | 'expired' | 'restricted' => {
        if (!status) return 'restricted';
        
        switch (status) {
          case 'active':
          case 'trial':
          case 'expired':
          case 'restricted':
            return status;
          default:
            return 'restricted';
        }
      };

      setAccountStatus({
        hasAccess: hasAccess || false,
        accountStatus: normalizeAccountStatus(userProfile?.account_status),
        freeTrialEnd: userProfile?.free_trial_end,
        isLoading: false,
      });

    } catch (error) {
      console.error('Erreur lors de la vérification du statut du compte:', error);
      setAccountStatus({
        hasAccess: false,
        accountStatus: 'restricted',
        isLoading: false,
      });
    }
  };

  const updateAccountStatuses = async () => {
    try {
      const { error } = await supabase.rpc('update_account_statuses');
      if (error) throw error;
      await checkAccess();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
    }
  };

  useEffect(() => {
    if (user) {
      checkAccess();
    }
  }, [user]);

  return {
    ...accountStatus,
    checkAccess,
    updateAccountStatuses,
  };
};
