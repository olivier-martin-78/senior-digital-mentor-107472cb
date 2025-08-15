
import React, { useState, useEffect } from 'react';
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
          // Tracker la connexion
          trackLoginSession();
        }, 0);
        } else {
          // For anonymous users, clear data and stop loading immediately
          console.log('useAuthState - User signed out, clearing data');
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    AuthService.getSession().then(({ session: currentSession }) => {
      console.log('Initial session check:', currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        setTimeout(() => {
          fetchUserData(currentSession.user.id);
          trackLoginSession();
        }, 0);
      } else {
        // No session found, user is anonymous - this is normal
        console.log('useAuthState - No session found, setting loading to false');
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      }
    }).catch(error => {
      console.warn('Session check warning (non-fatal for anonymous users):', error);
      // For anonymous access, this is expected
      console.log('useAuthState - Session check failed, clearing state');
      setSession(null);
      setUser(null);
      setProfile(null);
      setRoles([]);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to fetch user data (profile and roles)
  const fetchUserData = async (userId: string) => {
    console.log('🔍 Fetching user data for:', userId);
    
    try {
      const userProfile = await AuthService.fetchUserProfile(userId);
      console.log('📝 User profile fetched:', userProfile);
      if (userProfile) {
        setProfile(userProfile);
      }
      
      const userRoles = await AuthService.fetchUserRoles(userId);
      console.log('🔐 User roles fetched:', userRoles);
      setRoles(userRoles);

      // Vérifier la désynchronisation après avoir récupéré les données
      setTimeout(() => {
        checkAuthDesynchronization(userId);
      }, 100);
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    } finally {
      console.log('useAuthState - Setting loading to false after fetchUserData');
      setIsLoading(false);
    }
  };

  // Fonction pour détecter et corriger la désynchronisation d'authentification
  const checkAuthDesynchronization = async (userId: string) => {
    try {
      // Vérifier si on a des données utilisateur mais pas de session localStorage
      const localStorageSession = localStorage.getItem('sb-cvcebcisijjmmmwuedcv-auth-token');
      
      if (!localStorageSession && userId) {
        console.log('🔧 Auth Recovery - Désynchronisation détectée: données user présentes mais pas de localStorage');
        
        // Import dynamique pour éviter les dépendances circulaires
        const { detectAuthDesync, forceAuthReconnection } = await import('@/utils/authRecovery');
        
        const isDesync = await detectAuthDesync();
        if (isDesync) {
          console.log('🔄 Auth Recovery - Tentative de récupération automatique...');
          const recovered = await forceAuthReconnection();
          
          if (recovered) {
            console.log('✅ Auth Recovery - Récupération réussie');
          } else {
            console.warn('⚠️ Auth Recovery - Récupération échouée, l\'utilisateur devra se reconnecter manuellement');
          }
        }
      }
    } catch (error) {
      console.error('🔧 Auth Recovery - Erreur lors de la vérification:', error);
    }
  };

  const trackLoginSession = async () => {
    try {
      const { UserActionsService } = await import('@/services/UserActionsService');
      await UserActionsService.trackLogin();
    } catch (error) {
      console.error('Error tracking login session:', error);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    const hasRoleResult = roles.includes(role);
    console.log('🔍 Checking role:', role, 'Current roles:', roles, 'Has role:', hasRoleResult);
    return hasRoleResult;
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
