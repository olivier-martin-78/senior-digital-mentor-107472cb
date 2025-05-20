
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Profile, AppRole } from '@/types/supabase';
import { AuthService } from '@/services/AuthService';

/**
 * Hook to manage auth state
 */
export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('Environment detection:', { 
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), 
      userAgent: navigator.userAgent,
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined'
    });

    // Set up auth state listener FIRST
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (currentSession) => {
        console.log('Auth state changed:', 
          currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', 
          currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid deadlocks
          setTimeout(() => {
            fetchUserData(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    AuthService.getSession().then(({ session: currentSession }) => {
      console.log('Initial session check:', currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id);
      }
      setIsLoading(false);
    }).catch(error => {
      console.error('Session check error:', error);
      setIsLoading(false);
      setAuthError(error instanceof Error ? error : new Error('Failed to check authentication session'));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to fetch user data (profile and roles)
  const fetchUserData = async (userId: string) => {
    const userProfile = await AuthService.fetchUserProfile(userId);
    if (userProfile) {
      setProfile(userProfile);
    }
    
    const userRoles = await AuthService.fetchUserRoles(userId);
    setRoles(userRoles);
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  return {
    session,
    user,
    profile,
    roles,
    isLoading,
    setIsLoading,
    authError,
    hasRole,
    setAuthError
  };
};
