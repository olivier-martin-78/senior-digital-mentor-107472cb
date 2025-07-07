
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
        // Condition 1: Vérifier si l'utilisateur est un proche aidant
        const { data: caregiverData } = await supabase
          .from('caregivers')
          .select('id')
          .eq('email', session.user.email)
          .limit(1);

        if (caregiverData && caregiverData.length > 0) {
          setHasCaregiversAccess(true);
          setIsLoading(false);
          return;
        }

        // Condition 2: Vérifier si l'utilisateur a le rôle professionnel
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'professionnel')
          .limit(1);

        if (roleData && roleData.length > 0) {
          setHasCaregiversAccess(true);
        } else {
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
  }, [session]);

  return { hasCaregiversAccess, isLoading };
};
