
import { useState, useEffect } from 'react';
import { AppRole } from '@/types/supabase';

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
        const { useAuth } = await import('@/contexts/AuthContext');
        const authContext = useAuth();
        
        setAuthResult({
          hasRole: authContext.hasRole,
          isAuthenticated: !!authContext.user
        });
      } catch (error) {
        // Si useAuth échoue, l'utilisateur n'est pas authentifié - c'est normal
        console.log('useOptionalAuth - Utilisateur non authentifié, mode public');
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
