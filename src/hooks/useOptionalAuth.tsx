
import { useState, useEffect } from 'react';
import { AppRole } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';

interface OptionalAuthResult {
  hasRole: (role: AppRole) => boolean;
  isAuthenticated: boolean;
}

export const useOptionalAuth = (): OptionalAuthResult => {
  const [authResult, setAuthResult] = useState<OptionalAuthResult>({
    hasRole: () => false,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier directement avec Supabase au lieu d'utiliser useAuth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Récupérer les rôles de l'utilisateur
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
          
          const userRoles = rolesData?.map(row => row.role) || [];
          
          setAuthResult({
            hasRole: (role: AppRole) => userRoles.includes(role),
            isAuthenticated: true
          });
        } else {
          // Pas d'utilisateur connecté
          setAuthResult({
            hasRole: () => false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.log('useOptionalAuth - Erreur lors de la vérification auth:', error);
        setAuthResult({
          hasRole: () => false,
          isAuthenticated: false
        });
      }
    };

    checkAuth();
  }, []);

  return authResult;
};
