import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that provides optional authentication state without throwing errors
 * if used outside of AuthProvider context
 */
export const useOptionalAuth = () => {
  try {
    return useAuth();
  } catch (error) {
    // Return default values if AuthProvider is not available
    return {
      session: null,
      user: null,
      profile: null,
      roles: [],
      isLoading: false,
      hasRole: () => false,
      getEffectiveUserId: () => undefined,
      signOut: async () => {},
      checkEmailConfirmation: async () => false,
    };
  }
};