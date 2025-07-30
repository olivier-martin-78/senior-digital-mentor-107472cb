
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useCaregiversAccess = () => {
  const { session } = useAuth();
  const [hasCaregiversAccess, setHasCaregiversAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCaregiversAccess = async () => {
      if (!session?.user) {
        setHasCaregiversAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Vérification accès aidants pour:', session.user.email, session.user.id);

        // Condition 1: Vérifier si l'utilisateur est un proche aidant
        const { data: caregiverData, error: caregiverError } = await supabase
          .from('caregivers')
          .select('id')
          .eq('email', session.user.email)
          .limit(1);

        if (caregiverError) {
          console.error('Erreur vérification caregiver:', caregiverError);
        }

        if (caregiverData && caregiverData.length > 0) {
          console.log('✅ Utilisateur identifié comme proche aidant');
          setHasCaregiversAccess(true);
          setIsLoading(false);
          return;
        }

        // Condition 2: Vérifier si l'utilisateur a le rôle professionnel
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'professionnel')
          .limit(1);

        if (roleError) {
          console.error('Erreur vérification rôle:', roleError);
        }

        console.log('🔍 Données de rôle:', roleData);

        if (roleData && roleData.length > 0) {
          console.log('✅ Utilisateur a le rôle professionnel');
          setHasCaregiversAccess(true);
        } else {
          console.log('❌ Utilisateur n\'a pas accès aux aidants');
          setHasCaregiversAccess(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'accès aidants:', error);
        setHasCaregiversAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCaregiversAccess();
  }, [session?.user?.id, session?.user?.email]); // Dépendances spécifiques

  return { hasCaregiversAccess, isLoading };
};
