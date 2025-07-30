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
    console.error('Auth error:', error);
    setAuthError(error);
    onAuthError?.(error);
    
    // Attempt recovery if enabled and within retry limits
    if (enableRecovery && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      attemptAuthRecovery().then((recovered) => {
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

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);
        
        // Handle session changes
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear error state on successful auth
        if (session && authError) {
          setAuthError(null);
          setRetryCount(0);
        }
        
        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            setIsLoading(false);
            break;
          case 'SIGNED_OUT':
            clearAuthState();
            setIsLoading(false);
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            break;
          case 'USER_UPDATED':
            console.log('User updated');
            break;
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session check error:', error);
          // Try recovery if this is the first attempt
          if (enableRecovery && retryCount === 0) {
            const recovered = await attemptAuthRecovery();
            if (!recovered) {
              handleAuthError(error);
            }
          } else {
            handleAuthError(error);
          }
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        if (mounted) {
          handleAuthError(error as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [enableRecovery, retryCount, authError, handleAuthError, clearAuthState]);

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