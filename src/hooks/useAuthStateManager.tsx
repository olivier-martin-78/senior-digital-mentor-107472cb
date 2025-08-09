import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState, attemptAuthRecovery } from '@/utils/authUtils';
import { toast } from '@/hooks/use-toast';

interface AuthStateManagerOptions {
  onAuthError?: (error: Error) => void;
  enableRecovery?: boolean;
  maxRetries?: number;
}

export const useAuthStateManager = (options: AuthStateManagerOptions = {}) => {
  const { onAuthError, enableRecovery = true, maxRetries = 3 } = options;
  
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleAuthError = useCallback((error: Error) => {
    console.log('🔥 [AUTH_STATE_MANAGER_DEBUG] Auth error detected:', error);
    console.error('Auth error:', error);
    setAuthError(error);
    onAuthError?.(error);
    
    // Attempt recovery if enabled and within retry limits
    if (enableRecovery && retryCount < maxRetries) {
      console.log('🔥 [AUTH_STATE_MANAGER_DEBUG] Attempting recovery, retry:', retryCount + 1);
      setRetryCount(prev => prev + 1);
      attemptAuthRecovery().then((recovered) => {
        console.log('🔥 [AUTH_STATE_MANAGER_DEBUG] Recovery result:', recovered);
        if (!recovered) {
          toast({
            title: 'Problème de connexion',
            description: 'Veuillez vous reconnecter',
            variant: 'destructive'
          });
        }
      });
    }
  }, [onAuthError, enableRecovery, retryCount, maxRetries]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setSession(session);
      setUser(session?.user ?? null);
      setAuthError(null);
      setRetryCount(0);
      
      return session;
    } catch (error) {
      handleAuthError(error as Error);
      return null;
    }
  }, [handleAuthError]);

  const clearAuthState = useCallback(() => {
    cleanupAuthState();
    setSession(null);
    setUser(null);
    setAuthError(null);
    setRetryCount(0);
  }, []);

  const secureSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      clearAuthState();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force cleanup even if signOut fails
      clearAuthState();
      window.location.href = '/auth';
    }
  }, [clearAuthState]);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🔥 [AUTH_STATE_MANAGER_DEBUG] Initializing auth');
        // Set up auth state listener first (only once)
        const { data } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;

            console.log('🔥 [AUTH_STATE_MANAGER_DEBUG] Auth state change:', event, session?.user?.id);
            
            // Prevent multiple rapid updates
            if (event === 'INITIAL_SESSION') {
              setSession(session);
              setUser(session?.user ?? null);
              setIsLoading(false);
              return;
            }
            
            // Handle session changes
            setSession(session);
            setUser(session?.user ?? null);
            
            // Clear error state on successful auth
            if (session && authError) {
              setAuthError(null);
              setRetryCount(0);
            }
          }
        );
        
        authSubscription = data.subscription;

        // Check for existing session only once
        console.log('🔥 [AUTH_STATE_MANAGER_DEBUG] Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          console.log('🔥 [AUTH_STATE_MANAGER_DEBUG] Initial session result:', { session: !!session, error: !!error });
          if (error) {
            handleAuthError(error);
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
          setIsLoading(false);
        }

      } catch (error) {
        if (mounted) {
          handleAuthError(error as Error);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array to run only once

  return {
    session,
    user,
    isLoading,
    authError,
    retryCount,
    refreshSession,
    clearAuthState,
    secureSignOut,
    isAuthenticated: !!session?.user,
    isRecovering: retryCount > 0 && retryCount < maxRetries
  };
};