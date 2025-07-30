import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useCaregiversAccess = () => {
  const { session, roles, hasRole, isLoading: authLoading } = useAuth();
  const [hasCaregiversAccess, setHasCaregiversAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attendre que l'authentification soit terminée
    if (authLoading) {
      console.log('🕐 useCaregiversAccess: Attente de l\'authentification...');
      return;
    }

    const checkCaregiversAccess = async () => {
      console.log('🔍 useCaregiversAccess: Vérification de l\'accès pour:', session?.user?.email, session?.user?.id);
      console.log('🔍 Rôles disponibles:', roles);

      if (!session?.user) {
        console.log('❌ useCaregiversAccess: Pas de session utilisateur');
        setHasCaregiversAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        // Condition 1: Vérifier si l'utilisateur a le rôle professionnel (plus direct)
        if (hasRole('professionnel')) {
          console.log('✅ useCaregiversAccess: Utilisateur a le rôle professionnel');
          setHasCaregiversAccess(true);
          setIsLoading(false);
          return;
        }

        // Condition 2: Vérifier si l'utilisateur est un proche aidant
        console.log('🔍 useCaregiversAccess: Vérification proche aidant pour:', session.user.email);
        const { data: caregiverData, error: caregiverError } = await supabase
          .from('caregivers')
          .select('id')
          .eq('email', session.user.email)
          .limit(1);

        if (caregiverError) {
          console.error('❌ useCaregiversAccess: Erreur vérification caregiver:', caregiverError);
        } else if (caregiverData && caregiverData.length > 0) {
          console.log('✅ useCaregiversAccess: Utilisateur identifié comme proche aidant');
          setHasCaregiversAccess(true);
          setIsLoading(false);
          return;
        }

        console.log('❌ useCaregiversAccess: Utilisateur n\'a pas accès aux aidants');
        setHasCaregiversAccess(false);
      } catch (error) {
        console.error('❌ useCaregiversAccess: Erreur lors de la vérification:', error);
        setHasCaregiversAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCaregiversAccess();
  }, [session?.user?.id, session?.user?.email, roles, hasRole, authLoading]);

  return { hasCaregiversAccess, isLoading };
};